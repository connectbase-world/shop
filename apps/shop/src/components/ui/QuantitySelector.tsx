import { Minus, Plus } from 'lucide-react'

type QuantitySelectorProps = {
  quantity: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
}

export function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-gray-200">
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= min}
        aria-label="수량 감소"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-gray-200">
        {quantity}
      </span>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label="수량 증가"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
