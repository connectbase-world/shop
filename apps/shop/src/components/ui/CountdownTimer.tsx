import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/useI18n'

type Props = {
  targetDate: string
  label?: string
}

function getTimeRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

export function CountdownTimer({ targetDate, label }: Props) {
  const { t } = useI18n()
  const [time, setTime] = useState(() => getTimeRemaining(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeRemaining(targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (time.expired) return null

  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-gray-500 mr-1">{label}</span>}
      <div className="flex items-center gap-1 text-sm font-mono font-bold">
        {time.days > 0 && (
          <>
            <span className="bg-black text-white px-1.5 py-0.5 rounded text-xs min-w-[28px] text-center">
              {time.days}
            </span>
            <span className="text-gray-400 text-xs">{t.promotion.days}</span>
          </>
        )}
        <span className="bg-black text-white px-1.5 py-0.5 rounded text-xs min-w-[28px] text-center">
          {String(time.hours).padStart(2, '0')}
        </span>
        <span className="text-gray-400 text-xs">:</span>
        <span className="bg-black text-white px-1.5 py-0.5 rounded text-xs min-w-[28px] text-center">
          {String(time.minutes).padStart(2, '0')}
        </span>
        <span className="text-gray-400 text-xs">:</span>
        <span className="bg-black text-white px-1.5 py-0.5 rounded text-xs min-w-[28px] text-center">
          {String(time.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
