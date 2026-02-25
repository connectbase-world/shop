import { useI18n } from '@/hooks/useI18n'

export function Footer() {
  const { t, locale } = useI18n()

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 고객센터 */}
          <div>
            <p className="text-sm font-bold mb-3">{t.footer.customerService}</p>
            <p className="text-lg font-bold text-black mb-1">1234-5678</p>
            <p className="text-xs text-gray-500">
              {locale === 'ko'
                ? '평일 10:00 - 18:00 (점심 12:00 - 13:00)'
                : 'Mon-Fri 10:00 - 18:00 (Lunch 12:00 - 13:00)'}
            </p>
            <p className="text-xs text-gray-500">
              {locale === 'ko' ? '주말·공휴일 휴무' : 'Closed on weekends & holidays'}
            </p>
          </div>

          {/* 약관 링크 */}
          <div>
            <p className="text-sm font-bold mb-3">
              {locale === 'ko' ? '정책' : 'Policy'}
            </p>
            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <span className="hover:text-gray-900 cursor-pointer">
                {locale === 'ko' ? '이용약관' : 'Terms of Service'}
              </span>
              <span className="hover:text-gray-900 cursor-pointer font-medium">
                {locale === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
              </span>
              <span className="hover:text-gray-900 cursor-pointer">
                {locale === 'ko' ? '교환 및 반품 안내' : 'Return & Exchange Policy'}
              </span>
            </div>
          </div>

          {/* 안내 */}
          <div>
            <p className="text-sm font-bold mb-3">
              {locale === 'ko' ? '배송 안내' : 'Shipping Info'}
            </p>
            <div className="text-xs text-gray-500 flex flex-col gap-1">
              <p>{locale === 'ko' ? '배송비: 3,000원 (50,000원 이상 무료)' : 'Shipping: ₩3,000 (Free over ₩50,000)'}</p>
              <p>{locale === 'ko' ? '배송기간: 결제 후 2-3일 (영업일 기준)' : 'Delivery: 2-3 business days'}</p>
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 leading-relaxed">
          <p className="mb-1">
            {locale === 'ko'
              ? '상호명: SHOP | 대표: 홍길동 | 사업자등록번호: 123-45-67890'
              : 'Company: SHOP | CEO: John Doe | Business Reg: 123-45-67890'}
          </p>
          <p className="mb-1">
            {locale === 'ko'
              ? '통신판매업 신고번호: 제2024-서울강남-12345호 | 개인정보보호책임자: 홍길동'
              : 'E-Commerce Reg: 2024-Seoul-12345 | Privacy Officer: John Doe'}
          </p>
          <p className="mb-1">
            {locale === 'ko'
              ? '주소: 서울특별시 강남구 테헤란로 123, 4층 | 이메일: support@shop.com'
              : 'Address: 123 Teheran-ro, Gangnam-gu, Seoul | Email: support@shop.com'}
          </p>
          <p className="mt-4">
            &copy; {new Date().getFullYear()} SHOP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
