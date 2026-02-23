import { useI18n } from '@/hooks/useI18n'

export function Footer() {
  const { locale } = useI18n()

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-sm font-bold mb-2">SHOP</p>
            <p className="text-xs text-gray-500">
              {locale === 'ko' ? '고객센터 1234-5678' : 'Customer Service 1234-5678'}
            </p>
            <p className="text-xs text-gray-500">
              {locale === 'ko'
                ? '평일 10:00 - 18:00 (점심 12:00 - 13:00)'
                : 'Mon-Fri 10:00 - 18:00 (Lunch 12:00 - 13:00)'}
            </p>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <span className="hover:text-gray-900 cursor-pointer">
              {locale === 'ko' ? '이용약관' : 'Terms of Service'}
            </span>
            <span className="hover:text-gray-900 cursor-pointer">
              {locale === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
            </span>
          </div>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SHOP. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
