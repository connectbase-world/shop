import { useState, useEffect, useCallback } from 'react'
import { Star, Send } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { REVIEWS_TABLE_ID } from '@/lib/constants'
import { toReviews } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { Link } from '@tanstack/react-router'
import type { Review } from '@/lib/types'

type Props = {
  productId: string
}

function StarRating({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
}: {
  rating: number
  size?: 'sm' | 'md'
  interactive?: boolean
  onChange?: (rating: number) => void
}) {
  const [hover, setHover] = useState(0)
  const px = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${px} ${
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({ productId }: Props) {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const loadReviews = useCallback(async () => {
    try {
      const result = await cb.database.getData(REVIEWS_TABLE_ID, { limit: 1000 })
      const all = toReviews(result.data ?? [])
      const filtered = all
        .filter((r) => r.product_id === productId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setReviews(filtered)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t.review.contentRequired)
      return
    }
    if (!user) return

    setSubmitting(true)
    setError('')

    try {
      await cb.database.createData(REVIEWS_TABLE_ID, {
        data: {
          product_id: productId,
          member_id: user.memberId,
          nickname: user.nickname || t.review.defaultNickname,
          rating,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
      })
      setContent('')
      setRating(5)
      await loadReviews()
    } catch {
      setError(t.review.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t.review.deleteConfirm)) return
    try {
      await cb.database.deleteData(REVIEWS_TABLE_ID, reviewId)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch {
      alert(t.review.deleteFailed)
    }
  }

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div>
      <h2 className="text-lg font-bold mb-6">
        {t.review.reviews} {reviews.length > 0 && <span className="text-gray-400 font-normal">({reviews.length})</span>}
      </h2>

      {/* 리뷰 요약 */}
      {reviews.length > 0 && (
        <div className="flex items-start gap-8 mb-8 pb-8 border-b border-gray-100">
          <div className="text-center">
            <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} />
            <p className="text-xs text-gray-500 mt-1">
              {t.review.reviewCount.replace('{count}', String(reviews.length))}
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4 text-right">{star}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-gray-400 w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 작성 */}
      {user ? (
        <div className="mb-8 bg-gray-50 rounded-sm p-5">
          <p className="text-sm font-medium mb-3">{t.review.writeReview}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">{t.review.ratingLabel}</span>
            <StarRating rating={rating} interactive onChange={setRating} size="md" />
            <span className="text-sm text-gray-500">{t.review.ratingValue.replace('{rating}', String(rating))}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmit()}
              placeholder={t.review.placeholder}
              className="flex-1 px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              disabled={submitting}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              {t.review.submit}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 rounded-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-2">{t.review.loginRequired}</p>
          <Link
            to="/login"
            className="text-sm font-medium text-black hover:underline"
          >
            {t.common.login}
          </Link>
        </div>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">{t.common.loading}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {t.review.noReviews} {t.review.beFirstReview}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="py-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{review.nickname}</span>
                  <StarRating rating={review.rating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                  </span>
                  {user?.memberId === review.member_id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {t.common.delete}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
