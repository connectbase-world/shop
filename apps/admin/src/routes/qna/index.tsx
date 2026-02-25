import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { MessageCircleQuestion, CheckCircle, Clock, Send } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { QNA_TABLE_ID, PRODUCTS_TABLE_ID } from '@/lib/constants'
import { toQnAs, toProducts, formatDateTime } from '@/lib/utils'
import type { QnA, Product } from '@/lib/types'

export const Route = createFileRoute('/qna/')({
  loader: async () => {
    const [qnaResult, productResult] = await Promise.all([
      cb.database.getData(QNA_TABLE_ID, { limit: 1000 }),
      cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }),
    ])
    const qnas = toQnAs(qnaResult.data ?? [])
    const products = toProducts(productResult.data ?? [])
    qnas.sort((a, b) => {
      if (a.is_answered !== b.is_answered) return a.is_answered ? 1 : -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { qnas, products }
  },
  component: QnAPage,
})

function QnAPage() {
  const { qnas, products } = Route.useLoaderData()
  const router = useRouter()
  const [answerTarget, setAnswerTarget] = useState<QnA | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const productMap = new Map<string, Product>()
  for (const p of products) productMap.set(p.id, p)

  const handleAnswer = async () => {
    if (!answerTarget || !answerText.trim()) return
    setSubmitting(true)
    try {
      await cb.database.updateData(QNA_TABLE_ID, answerTarget.id, {
        data: {
          ...Object.fromEntries(
            Object.entries(answerTarget).filter(([k]) => k !== 'id'),
          ),
          answer: answerText.trim(),
          is_answered: true,
          answered_at: new Date().toISOString(),
        },
      })
      setAnswerTarget(null)
      setAnswerText('')
      router.invalidate()
    } catch {
      alert('답변 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const unanswered = qnas.filter((q) => !q.is_answered).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Q&A 관리</h1>
          {unanswered > 0 && (
            <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
              미답변 {unanswered}건
            </span>
          )}
        </div>
      </div>

      {qnas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          등록된 문의가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {qnas.map((qna) => {
            const product = productMap.get(qna.product_id)
            return (
              <div
                key={qna.id}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        qna.is_answered
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {qna.is_answered ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {qna.is_answered ? '답변완료' : '답변대기'}
                    </span>
                    {qna.is_secret && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        비밀글
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(qna.created_at)}
                  </span>
                </div>

                {product && (
                  <p className="text-xs text-gray-400 mb-2">
                    상품: {product.name}
                  </p>
                )}

                <div className="flex items-start gap-2 mb-2">
                  <MessageCircleQuestion className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {qna.nickname}
                    </p>
                    <p className="text-sm text-gray-800">{qna.question}</p>
                  </div>
                </div>

                {qna.is_answered && qna.answer ? (
                  <div className="mt-3 pl-6 border-l-2 border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">
                      관리자 답변{' '}
                      {qna.answered_at && `· ${formatDateTime(qna.answered_at)}`}
                    </p>
                    <p className="text-sm text-gray-700">{qna.answer}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {answerTarget?.id === qna.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && !submitting && handleAnswer()
                          }
                          placeholder="답변을 입력하세요..."
                          className="flex-1 px-3 py-2 border border-gray-200 text-sm rounded-md outline-none focus:border-gray-400"
                          autoFocus
                        />
                        <button
                          onClick={handleAnswer}
                          disabled={submitting || !answerText.trim()}
                          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submitting ? '등록 중...' : '답변'}
                        </button>
                        <button
                          onClick={() => {
                            setAnswerTarget(null)
                            setAnswerText('')
                          }}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAnswerTarget(qna)
                          setAnswerText('')
                        }}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        답변 작성하기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
