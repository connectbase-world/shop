import { useState, useEffect, useCallback } from 'react'
import { MessageCircleQuestion, Send, Lock, CheckCircle, Clock } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { QNA_TABLE_ID } from '@/lib/constants'
import { toQnAs } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { Link } from '@tanstack/react-router'
import { trackEvent } from '@/lib/analytics'
import type { QnA } from '@/lib/types'

type Props = {
  productId: string
}

export function ProductQnA({ productId }: Props) {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [qnas, setQnas] = useState<QnA[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [error, setError] = useState('')

  const loadQnAs = useCallback(async () => {
    try {
      const result = await cb.database.getData(QNA_TABLE_ID, { limit: 1000 })
      const all = toQnAs(result.data ?? [])
      const filtered = all
        .filter((q) => q.product_id === productId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      setQnas(filtered)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadQnAs()
  }, [loadQnAs])

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t.qna.contentRequired)
      return
    }
    if (!user) return

    setSubmitting(true)
    setError('')

    try {
      await cb.database.createData(QNA_TABLE_ID, {
        data: {
          product_id: productId,
          member_id: user.memberId,
          nickname: user.nickname || '회원',
          question: content.trim(),
          answer: '',
          is_answered: false,
          is_secret: isSecret,
          created_at: new Date().toISOString(),
          answered_at: '',
        },
      })
      trackEvent('qna_created', { product_id: productId })
      setContent('')
      setIsSecret(false)
      await loadQnAs()
    } catch {
      setError(t.qna.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (qnaId: string) => {
    if (!confirm(t.qna.deleteConfirm)) return
    try {
      await cb.database.deleteData(QNA_TABLE_ID, qnaId)
      setQnas((prev) => prev.filter((q) => q.id !== qnaId))
    } catch {
      // ignore
    }
  }

  const canView = (qna: QnA) => {
    if (!qna.is_secret) return true
    if (user?.memberId === qna.member_id) return true
    return false
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-6">
        {t.qna.title}{' '}
        {qnas.length > 0 && (
          <span className="text-gray-400 font-normal">({qnas.length})</span>
        )}
      </h2>

      {/* 문의 작성 폼 */}
      {user ? (
        <div className="mb-8 bg-gray-50 rounded-sm p-5">
          <p className="text-sm font-medium mb-3">{t.qna.writeQuestion}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !submitting && handleSubmit()
              }
              placeholder={t.qna.questionPlaceholder}
              className="flex-1 px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              disabled={submitting}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              {t.qna.submit}
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{t.qna.secretQuestion}</span>
          </label>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 rounded-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-2">{t.qna.loginRequired}</p>
          <Link
            to="/login"
            className="text-sm font-medium text-black hover:underline"
          >
            {t.common.login}
          </Link>
        </div>
      )}

      {/* 문의 목록 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {t.common.loading}
        </div>
      ) : qnas.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {t.qna.noQuestions} {t.qna.beFirstQuestion}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {qnas.map((qna) => (
            <div key={qna.id} className="py-4">
              {canView(qna) ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{qna.nickname}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          qna.is_answered
                            ? 'bg-green-50 text-green-600'
                            : 'bg-yellow-50 text-yellow-600'
                        }`}
                      >
                        {qna.is_answered ? (
                          <CheckCircle className="w-2.5 h-2.5" />
                        ) : (
                          <Clock className="w-2.5 h-2.5" />
                        )}
                        {qna.is_answered ? t.qna.answered : t.qna.waiting}
                      </span>
                      {qna.is_secret && (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(qna.created_at).toLocaleDateString(
                          locale === 'ko' ? 'ko-KR' : 'en-US',
                        )}
                      </span>
                      {user?.memberId === qna.member_id && (
                        <button
                          onClick={() => handleDelete(qna.id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {t.common.delete}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{qna.question}</p>
                  {qna.is_answered && qna.answer && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200 mt-2">
                      <p className="text-xs text-gray-400 mb-1">
                        {t.qna.answer}
                      </p>
                      <p className="text-sm text-gray-700">{qna.answer}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>{t.qna.secret}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
