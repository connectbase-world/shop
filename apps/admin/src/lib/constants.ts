export const PRODUCTS_TABLE_ID = '336cf35c-4391-497b-b650-6406f4001849'
export const ORDERS_TABLE_ID = 'f9392042-4e24-4e49-83f3-c16836c88ccb'
export const PROFILES_TABLE_ID = '941e341e-7a94-418e-bad8-1452add78914'
export const REVIEWS_TABLE_ID = '53554803-ab51-42f1-8eec-c2bccf7cae9e'
export const MEMBERS_TABLE_ID = '51581591-ac47-4f8f-8600-00c9425746a9'
export const COUPONS_TABLE_ID = 'ab179647-e178-438f-ae0f-99e0f895d355'
export const USER_COUPONS_TABLE_ID = '04f4aad3-f825-4a14-8e02-3ab4c40e6d61'
export const FILE_STORAGE_ID = '08f9def3-8bf2-4007-b6c9-faf7f1151828'
export const SHOP_STORAGE_ID = '019c852d-4741-7765-a06a-70acf93fb09b'
export const MILEAGE_HISTORY_TABLE_ID = '236d7351-ff20-43a7-88cf-7ae777a6aa9a'
export const MILEAGE_EARN_RATE = 0.03
export const INFLUENCERS_TABLE_ID = 'dcbfe9fc-8661-4a45-bd55-6bb9cbfe5f30'
export const COMMISSIONS_TABLE_ID = 'c9ed7a77-fd3e-4def-9482-8f7a9da5a357'
export const DEFAULT_COMMISSION_RATE = 0.05
export const MAX_QUERY_LIMIT = 1000
export const POSTS_TABLE_ID = 'd6d86f35-1fda-4dcc-8194-2e3584971fe1'
export const BOARDS_TABLE_ID = 'a64b20b7-800f-42ed-ad78-598a02b37a40'
export const PAGES_TABLE_ID = 'e1328a21-a403-4523-9473-dd9afc6aa036'
export const NAVIGATIONS_TABLE_ID = '4bd65ca7-6b4c-4a9d-83c1-70df2ad5ec24'
export const NAV_ITEMS_TABLE_ID = '585054ff-2c87-42c0-bf5a-dc42c0391bc3'
export const QNA_TABLE_ID = '51c3cb5c-3c6b-408b-8307-e6c72a756a41'
export const BANNERS_TABLE_ID = '343e1120-ca71-4449-9900-dfde2610c00d'
export const PROMOTIONS_TABLE_ID = '0aa6b603-83d2-4805-bad2-c14abea95e2a'

export const SUPPORTED_LANGUAGES: { code: import('./types').SupportedLocale; label: string }[] = [
  { code: 'en', label: 'English' },
]

export const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: '상의', label: '상의' },
  { key: '하의', label: '하의' },
  { key: '아우터', label: '아우터' },
  { key: '신발', label: '신발' },
  { key: '악세서리', label: '악세서리' },
] as const
