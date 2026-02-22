import { Link } from '@tanstack/react-router'
import { formatPrice } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/lib/constants'

type CartSummaryProps = {
  totalPrice: number
  totalItems: number
}

export function CartSummary({ totalPrice, totalItems }: CartSummaryProps) {
  const shippingFee = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = totalPrice + shippingFee

  return (
    <div className="bg-gray-50 p-6 rounded-sm">
      <h2 className="text-lg font-bold mb-6">주문 요약</h2>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">상품 금액 ({totalItems}개)</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">배송비</span>
          <span>
            {shippingFee === 0 ? (
              <span className="text-green-600">무료</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>
        {shippingFee > 0 && (
          <p className="text-xs text-gray-400">
            {formatPrice(FREE_SHIPPING_THRESHOLD)} 이상 구매 시 무료배송
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
        <span className="font-bold">총 결제 금액</span>
        <span className="text-xl font-bold">{formatPrice(finalTotal)}</span>
      </div>

      <Link
        to="/checkout"
        className="block w-full mt-6 py-4 bg-black text-white text-sm font-medium text-center hover:bg-gray-800 transition-colors"
      >
        주문하기
      </Link>
    </div>
  )
}
