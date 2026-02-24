const ko = {
  // 공통
  common: {
    home: '홈',
    products: '상품',
    cart: '장바구니',
    mypage: '마이페이지',
    login: '로그인',
    logout: '로그아웃',
    search: '검색',
    all: '전체',
    loading: '로딩 중...',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    confirm: '확인',
    close: '닫기',
    back: '뒤로',
    next: '다음',
    previous: '이전',
    more: '더보기',
    won: '원',
    quantity: '수량',
    soldOut: '품절',
    freeShipping: '무료',
    copy: '복사',
    copied: '복사됨!',
  },

  // 헤더
  header: {
    searchPlaceholder: '상품 검색...',
    wishlist: '찜 목록',
  },

  // 홈페이지
  home: {
    featuredProducts: '추천 상품',
    newArrivals: '신상품',
    viewAll: '전체 보기',
    shopByCategory: '카테고리별 쇼핑',
    heroDescription: '미니멀한 디자인, 편안한 착용감. 새로운 시즌 컬렉션을 만나보세요.',
    shopNow: '상품 보기',
  },

  // 카테고리
  categories: {
    all: '전체',
    tops: '상의',
    bottoms: '하의',
    outerwear: '아우터',
    shoes: '신발',
    accessories: '악세서리',
  },

  // 상품
  product: {
    category: '카테고리',
    price: '가격',
    description: '설명',
    stock: '재고',
    addToCart: '장바구니 담기',
    addedToCart: '장바구니에 담았습니다',
    buyNow: '바로구매',
    soldOutMessage: '품절된 상품입니다',
    totalPrice: '총 상품 금액',
    detailInfo: '상품 상세 정보',
    relatedProducts: '같은 카테고리 추천 상품',
    sortNewest: '최신순',
    sortPriceAsc: '가격 낮은순',
    sortPriceDesc: '가격 높은순',
    noProducts: '상품이 없습니다',
    itemCount: '{count}개',
    searchResults: '검색 결과',
    clearSearch: '초기화',
    noSearchResults: '"{q}" 검색 결과가 없습니다',
    tryDifferentSearch: '다른 검색어를 입력해보세요',
    tryDifferentCategory: '다른 카테고리를 선택해보세요',
  },

  // 리뷰
  review: {
    reviews: '리뷰',
    writeReview: '리뷰 작성',
    noReviews: '아직 리뷰가 없습니다',
    beFirstReview: '첫 번째 리뷰를 작성해보세요!',
    placeholder: '상품에 대한 솔직한 후기를 남겨주세요...',
    submit: '리뷰 등록',
    loginRequired: '리뷰를 작성하려면 로그인이 필요합니다.',
    ratingRequired: '별점을 선택해주세요.',
    contentRequired: '리뷰 내용을 입력해주세요.',
    defaultNickname: '회원',
    submitFailed: '리뷰 등록에 실패했습니다.',
    deleteConfirm: '리뷰를 삭제하시겠습니까?',
    deleteFailed: '삭제에 실패했습니다.',
    reviewCount: '{count}개 리뷰',
    ratingLabel: '별점',
    ratingValue: '{rating}점',
  },

  // 장바구니
  cart: {
    title: '장바구니',
    empty: '장바구니가 비어있습니다',
    emptyDescription: '마음에 드는 상품을 담아보세요',
    goShopping: '쇼핑하러 가기',
    removeItem: '삭제',
    clearAll: '전체 삭제',
    subtotal: '상품 금액',
    shippingFee: '배송비',
    total: '총 결제 금액',
    checkout: '주문하기',
    freeShippingNotice: '{amount} 이상 무료배송',
    freeShippingRemaining: '무료배송까지 {amount} 남음',
  },

  // 찜 목록
  wishlist: {
    title: '찜 목록',
    empty: '찜한 상품이 없습니다',
    emptyDescription: '하트를 눌러 마음에 드는 상품을 저장해보세요',
  },

  // 체크아웃
  checkout: {
    title: '주문하기',
    orderItems: '주문 상품',
    shippingInfo: '배송 정보',
    name: '이름',
    namePlaceholder: '홍길동',
    phone: '연락처',
    phonePlaceholder: '010-1234-5678',
    address: '주소',
    addressPlaceholder: '서울시 강남구 테헤란로 123',
    addressDetail: '상세주소',
    addressDetailPlaceholder: '101동 1001호',
    deliveryMemo: '배송 메모',
    memoPlaceholder: '부재 시 문 앞에 놓아주세요',
    required: '필수',
    loginNotice: '로그인하면 주문 내역을 확인할 수 있습니다.',
    fieldRequired: '이름, 연락처, 주소를 모두 입력해주세요.',
    productNotFound: '"{name}" 상품이 존재하지 않습니다.',
    outOfStock: '"{name}" 상품이 품절되었습니다.',
    insufficientStock: '"{name}" 재고가 부족합니다. (현재 재고: {stock}개)',
    paymentProcessing: '결제 처리 중...',
    payButton: '{amount} 결제하기',
    paymentError: '결제 요청 중 오류가 발생했습니다.',
    orderNameMultiple: '{name} 외 {count}건',

    // 쿠폰
    coupon: '쿠폰',
    couponCodePlaceholder: '쿠폰 코드를 입력하세요',
    apply: '적용',
    selectFromMyCoupons: '내 쿠폰에서 선택',
    selectCoupon: '내 쿠폰 선택',
    noCouponsAvailable: '사용 가능한 쿠폰이 없습니다',
    couponNotFound: '존재하지 않는 쿠폰 코드입니다.',
    couponInactive: '비활성화된 쿠폰입니다.',
    couponNotStarted: '아직 사용 기간이 아닙니다.',
    couponExpired: '만료된 쿠폰입니다.',
    couponMinOrder: '최소 주문 금액 {amount} 이상일 때 사용 가능합니다.',
    couponAlreadyUsed: '이미 사용한 쿠폰입니다.',
    couponNotApplicable: '이 주문에 적용할 수 없는 쿠폰입니다.',
    couponError: '쿠폰 적용 중 오류가 발생했습니다.',
    minOrderRequired: '{amount} 이상 주문 시 사용 가능',

    // 마일리지
    mileage: '마일리지',
    availableMileage: '보유 마일리지',
    useMileagePlaceholder: '사용할 마일리지',
    useAll: '전액 사용',
    mileageUsePending: '{amount} 사용 예정',

    // 결제 요약
    paymentSummary: '결제 금액',
    itemsTotal: '상품 금액 ({count}개)',
    shipping: '배송비',
    couponDiscount: '쿠폰 할인',
    mileageUse: '마일리지 사용',
    totalPayment: '총 결제 금액',
    earnEstimate: '구매 적립 예정: {amount}',
  },

  // 결제 결과
  payment: {
    confirming: '결제를 확인하고 있습니다...',
    success: '주문이 완료되었습니다',
    orderNumber: '주문번호',
    successDescription: '주문하신 상품은 빠르게 배송해드리겠습니다.',
    viewOrders: '주문 내역 확인',
    continueShopping: '쇼핑 계속하기',
    failed: '결제 확인 실패',
    failedTitle: '결제에 실패했습니다',
    failedDescription: '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
    errorCode: '에러 코드: {code}',
    retry: '다시 시도',
    goHome: '홈으로',
    goToCart: '장바구니로 돌아가기',
    invalidPaymentInfo: '결제 정보가 올바르지 않습니다.',
    amountMismatch: '결제 금액이 일치하지 않습니다. 위변조가 감지되었습니다.',
    orderMismatch: '주문 정보가 일치하지 않습니다.',
  },

  // 로그인
  auth: {
    loginTitle: '로그인',
    loginDescription: '소셜 계정으로 간편하게 로그인하세요',
    googleLogin: 'Google로 로그인',
    naverLogin: 'Naver로 로그인',
    processing: '로그인 처리 중...',
  },

  // 마이페이지
  mypage: {
    title: '마이페이지',
    greeting: '{name}님, 안녕하세요',
    loginRequired: '로그인이 필요합니다',
    loginDescription: '마이페이지를 이용하려면 로그인해주세요.',
    loginButton: '로그인하기',

    // 프로필
    myInfo: '내 정보',
    register: '등록',
    profileNotice: '배송 정보를 등록하면 주문 시 자동으로 입력됩니다.',
    saving: '저장 중...',

    // 쿠폰
    myCoupons: '내 쿠폰',
    noCoupons: '보유한 쿠폰이 없습니다',
    available: '사용가능',
    used: '사용완료',
    expired: '만료',

    // 마일리지
    mileage: '마일리지',
    noMileageHistory: '마일리지 내역이 없습니다',
    earn: '적립',
    spend: '사용',
    adjust: '조정',
    recentOnly: '최근 10건만 표시됩니다',

    // 인플루언서
    influencer: '인플루언서',
    influencerDescription: '인플루언서로 활동하고 추천 링크를 통한 판매 수수료를 받아보세요.',
    applyInfluencer: '인플루언서 신청하기',
    applying: '신청 중...',
    pendingReview: '심사중',
    pendingMessage: '인플루언서 신청이 접수되었습니다. 관리자 승인을 기다려주세요.',
    rejected: '반려',
    rejectedMessage: '인플루언서 신청이 반려되었습니다.',
    rejectedReason: '사유: {reason}',
    reapply: '재신청하기',
    active: '활동중',
    myReferralLink: '내 추천 링크',
    totalEarned: '총 수익',
    unsettled: '미정산',
    settled: '정산 완료',
    commissionRate: '커미션 비율',
    recentCommissions: '최근 커미션',
    noCommissions: '아직 커미션 내역이 없습니다',
    refLinkCommission: '추천 링크 커미션',
    couponCommission: '쿠폰 연동 커미션',
    settledStatus: '정산완료',
    pendingStatus: '대기',

    // 주문
    orders: '주문 내역',
    noOrders: '주문 내역이 없습니다',
    loadingOrders: '주문 내역을 불러오고 있습니다...',
    totalOrders: '전체 주문',
    shipping: '배송중',
    delivered: '배송완료',
    orderNumber: '주문번호',
    recipient: '수령인',
    phone: '연락처',
    memo: '메모',
    cancelOrder: '주문 취소',
    cancelling: '취소 처리 중...',
    cancelFailed: '주문 취소에 실패했습니다.',
    cancelConfirm: '주문을 취소하시겠습니까?',
  },

  // 주문 상태
  orderStatus: {
    paid: '결제완료',
    preparing: '준비중',
    shipped: '배송중',
    delivered: '배송완료',
    cancelled: '취소',
    refunded: '환불',
  },

  // 쿠폰 수령 페이지
  couponClaim: {
    claiming: '쿠폰을 확인하고 있습니다...',
    success: '쿠폰이 발급되었습니다!',
    alreadyClaimed: '이미 받은 쿠폰입니다',
    goShopping: '쇼핑하러 가기',
    goToMyCoupons: '내 쿠폰 확인하기',
    loginRequired: '쿠폰을 받으려면 로그인이 필요합니다.',
    loginButton: '로그인 후 쿠폰 받기',
  },

  // 게시판
  boards: {
    noPosts: '등록된 글이 없습니다',
    views: '조회',
    pinned: '고정',
    writePost: '글쓰기',
    loginToWrite: '글을 작성하려면 로그인이 필요합니다.',
    postTitle: '제목',
    postTitlePlaceholder: '제목을 입력하세요',
    postContent: '내용',
    postContentPlaceholder: '내용을 입력하세요',
    supported: '문법을 지원합니다',
    submitting: '등록 중...',
    secretPost: '비밀글',
    secretPostHidden: '비밀글입니다',
    secretPostBlocked: '비밀글입니다',
    secretPostBlockedDesc: '작성자만 확인할 수 있습니다.',
  },

  // 페이지
  pages: {
    noPages: '등록된 페이지가 없습니다',
  },

  // 푸터
  footer: {
    companyInfo: '상호명: Shop | 대표: 홍길동',
    customerService: '고객센터',
    businessInfo: '사업자 정보',
    copyright: '© 2024 Shop. All rights reserved.',
  },

  // 404
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
    goHome: '홈으로 돌아가기',
  },

  // 에러
  error: {
    title: '오류가 발생했습니다',
    unknown: '알 수 없는 오류가 발생했습니다.',
    goHome: '홈으로 돌아가기',
  },
} as const

export default ko
export type Translations = typeof ko
