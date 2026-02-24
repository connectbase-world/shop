import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, FileText, StickyNote, ExternalLink } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { NAVIGATIONS_TABLE_ID, NAV_ITEMS_TABLE_ID, BOARDS_TABLE_ID, PAGES_TABLE_ID } from '@/lib/constants'
import { toNavigation, toNavItems, toBoards, toPages } from '@/lib/utils'
import type { NavItem, Board, Page } from '@/lib/types'

export const Route = createFileRoute('/navigations/$navId')({
  loader: async ({ params }) => {
    const [navRes, itemsRes, boardsRes, pagesRes] = await Promise.all([
      cb.database.getData(NAVIGATIONS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(NAV_ITEMS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(PAGES_TABLE_ID, { limit: 1000 }),
    ])
    const navRow = (navRes.data ?? []).find((r: { id: string }) => r.id === params.navId)
    if (!navRow) throw new Error('네비게이션을 찾을 수 없습니다.')
    const navigation = toNavigation(navRow)
    const items = toNavItems(itemsRes.data ?? [])
      .filter((i) => i.navigation_id === params.navId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const boards = toBoards(boardsRes.data ?? []).filter((b) => b.is_active)
    const pages = toPages(pagesRes.data ?? []).filter((p) => p.is_published)
    return { navigation, items, boards, pages }
  },
  component: NavigationDetailPage,
})

function NavigationDetailPage() {
  const { navigation, items, boards, pages } = Route.useLoaderData()
  const router = useRouter()

  const [editName, setEditName] = useState(navigation.name)
  const [editSlug, setEditSlug] = useState(navigation.slug)
  const [editActive, setEditActive] = useState(navigation.is_active)
  const [savingMeta, setSavingMeta] = useState(false)

  const [addType, setAddType] = useState<'board' | 'page' | 'link'>('board')
  const [addTargetId, setAddTargetId] = useState('')
  const [addLabel, setAddLabel] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleSaveMeta = async () => {
    if (!editName.trim() || !editSlug.trim()) return
    setSavingMeta(true)
    try {
      await cb.database.updateData(NAVIGATIONS_TABLE_ID, navigation.id, {
        data: { name: editName, slug: editSlug, is_active: editActive },
      })
      router.invalidate()
    } finally {
      setSavingMeta(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addLabel.trim()) return
    if (addType === 'link' && !addUrl.trim()) return
    setAdding(true)
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) : -1
      await cb.database.createData(NAV_ITEMS_TABLE_ID, {
        data: {
          navigation_id: navigation.id,
          type: addType,
          target_id: addType === 'link' ? '' : addTargetId,
          label: addLabel,
          url: addType === 'link' ? addUrl : '',
          sort_order: maxOrder + 1,
        },
      })
      setAddLabel('')
      setAddUrl('')
      setAddTargetId('')
      setShowAddForm(false)
      router.invalidate()
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteItem = async (item: NavItem) => {
    if (!confirm(`"${item.label}" 아이템을 삭제하시겠습니까?`)) return
    await cb.database.deleteData(NAV_ITEMS_TABLE_ID, item.id)
    router.invalidate()
  }

  const handleMoveItem = async (item: NavItem, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    const other = items[swapIdx]
    await Promise.all([
      cb.database.updateData(NAV_ITEMS_TABLE_ID, item.id, { data: { sort_order: other.sort_order } }),
      cb.database.updateData(NAV_ITEMS_TABLE_ID, other.id, { data: { sort_order: item.sort_order } }),
    ])
    router.invalidate()
  }

  const handleSelectTarget = (targetId: string) => {
    setAddTargetId(targetId)
    if (addType === 'board') {
      const board = boards.find((b) => b.id === targetId)
      if (board && !addLabel) setAddLabel(board.name)
    } else if (addType === 'page') {
      const page = pages.find((p) => p.id === targetId)
      if (page && !addLabel) setAddLabel(page.title)
    }
  }

  const typeIcon = (type: string) => {
    if (type === 'board') return <FileText className="w-3.5 h-3.5" />
    if (type === 'page') return <StickyNote className="w-3.5 h-3.5" />
    return <ExternalLink className="w-3.5 h-3.5" />
  }

  const typeLabel = (type: string) => {
    if (type === 'board') return '게시판'
    if (type === 'page') return '페이지'
    return '링크'
  }

  const resolveTarget = (item: NavItem): string => {
    if (item.type === 'board') {
      const board = boards.find((b) => b.id === item.target_id)
      return board ? `/boards/${board.slug}` : '(삭제됨)'
    }
    if (item.type === 'page') {
      const page = pages.find((p) => p.id === item.target_id)
      return page ? `/p/${page.slug}` : '(삭제됨)'
    }
    return item.url || ''
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/navigations"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{navigation.name}</h1>
      </div>

      {/* 네비게이션 기본 정보 */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6 space-y-3">
        <p className="text-sm font-medium">기본 설정</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">슬러그</label>
            <input
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="rounded"
            />
            활성화
          </label>
          <button
            onClick={handleSaveMeta}
            disabled={savingMeta}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {savingMeta ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>

      {/* 아이템 목록 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">메뉴 아이템</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          아이템 추가
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddItem} className="mb-4 p-4 bg-blue-50 rounded-lg space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAddType('board'); setAddTargetId(''); setAddLabel('') }}
              className={`px-3 py-1.5 text-xs rounded-md ${addType === 'board' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}
            >
              게시판
            </button>
            <button
              type="button"
              onClick={() => { setAddType('page'); setAddTargetId(''); setAddLabel('') }}
              className={`px-3 py-1.5 text-xs rounded-md ${addType === 'page' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}
            >
              페이지
            </button>
            <button
              type="button"
              onClick={() => { setAddType('link'); setAddTargetId(''); setAddLabel('') }}
              className={`px-3 py-1.5 text-xs rounded-md ${addType === 'link' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}
            >
              커스텀 링크
            </button>
          </div>

          {addType === 'board' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">게시판 선택</label>
              <select
                value={addTargetId}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
              >
                <option value="">선택하세요</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.slug})</option>
                ))}
              </select>
            </div>
          )}

          {addType === 'page' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">페이지 선택</label>
              <select
                value={addTargetId}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
              >
                <option value="">선택하세요</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                ))}
              </select>
            </div>
          )}

          {addType === 'link' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL</label>
              <input
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
                placeholder="https://... 또는 /path"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">표시 이름 *</label>
            <input
              type="text"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
              placeholder="메뉴에 표시될 이름"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {adding ? '추가 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
          아이템이 없습니다. 게시판, 페이지 또는 커스텀 링크를 추가해보세요.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveItem(item, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveItem(item, 'down')}
                  disabled={idx === items.length - 1}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
                {typeIcon(item.type)}
                {typeLabel(item.type)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-gray-400 ml-2 truncate">{resolveTarget(item)}</span>
              </div>
              <button
                onClick={() => handleDeleteItem(item)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Shop에서 슬러그 <code className="bg-gray-100 px-1 rounded">{navigation.slug}</code>로 이 네비게이션을 참조합니다.
      </p>
    </div>
  )
}
