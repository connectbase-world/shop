# 미완료 기능 구현 계획서

> MCP 연결 오류(OAuth discovery 실패)로 DB 테이블/칼럼 생성이 불가하여 구현하지 못한 기능들

---

## 공통 리소스 ID

| 리소스 | ID |
|--------|-----|
| Database | `c8999c12-b17c-4bc9-b0cb-5aa0cb21eaf4` |
| Products 테이블 | `336cf35c-4391-497b-b650-6406f4001849` |
| Orders 테이블 | `f9392042-4e24-4e49-83f3-c16836c88ccb` |
| Reviews 테이블 | `53554803-ab51-42f1-8eec-c2bccf7cae9e` |
| Boards 테이블 | `a64b20b7-800f-42ed-ad78-598a02b37a40` |
| Posts 테이블 | `d6d86f35-1fda-4dcc-8194-2e3584971fe1` |
| Pages 테이블 | `e1328a21-a403-4523-9473-dd9afc6aa036` |
| Profiles 테이블 | `941e341e-7a94-418e-bad8-1452add78914` |
| Members 테이블 | `51581591-ac47-4f8f-8600-00c9425746a9` |
| Coupons 테이블 | `ab179647-e178-438f-ae0f-99e0f895d355` |
| User Coupons 테이블 | `04f4aad3-f825-4a14-8e02-3ab4c40e6d61` |
| Mileage History 테이블 | `236d7351-ff20-43a7-88cf-7ae777a6aa9a` |
| Influencers 테이블 | `dcbfe9fc-8661-4a45-bd55-6bb9cbfe5f30` |
| Commissions 테이블 | `c9ed7a77-fd3e-4def-9482-8f7a9da5a357` |
| Navigations 테이블 | `4bd65ca7-6b4c-4a9d-83c1-70df2ad5ec24` |
| Nav Items 테이블 | `585054ff-2c87-42c0-bf5a-dc42c0391bc3` |
| File Storage | `08f9def3-8bf2-4007-b6c9-faf7f1151828` |
| Shop Web Storage | `019c852d-4741-7765-a06a-70acf93fb09b` |
| Admin Web Storage | `019c85c0-4656-758a-bd51-1b0b16d5ea7c` |

---

## 0. MCP 연결 확인 후 우선 실행할 작업

MCP 연결이 복구되면 아래 칼럼이 실제 DB에 존재하는지 확인 필요.
코드에는 이미 반영되어 있으나, MCP 에러로 칼럼이 생성되지 않았을 수 있음.

### boards 테이블 (`a64b20b7-800f-42ed-ad78-598a02b37a40`)
- `allow_user_posts` (boolean) — 유저 글쓰기 허용 여부

### posts 테이블 (`d6d86f35-1fda-4dcc-8194-2e3584971fe1`)
- `board_id` (string) — 게시판 ID
- `is_secret` (boolean) — 비밀글 여부
- `member_id` (string) — 작성자 멤버 ID

### orders 테이블 (`f9392042-4e24-4e49-83f3-c16836c88ccb`)
- `tracking_carrier` (string) — 택배사
- `tracking_number` (string) — 운송장 번호
- `return_reason` (string) — 반품/교환 사유

### reviews 테이블 (`53554803-ab51-42f1-8eec-c2bccf7cae9e`)
- `images` (array) — 리뷰 이미지 URL 배열

> **확인 방법**: MCP `get_table_schema`로 각 테이블 스키마를 조회하여 칼럼 존재 여부 확인.
> 없으면 `create_column`으로 추가.

---

## 1. 상품 Q&A 게시판

### 개요
상품 상세 페이지에서 고객이 질문을 남기고 관리자가 답변하는 Q&A 기능.

### MCP 작업: `qna` 테이블 생성

DB: `c8999c12-b17c-4bc9-b0cb-5aa0cb21eaf4`

| 칼럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| product_id | string | O | 상품 ID |
| member_id | string | O | 질문 작성자 멤버 ID |
| nickname | string | O | 작성자 닉네임 |
| question | string | O | 질문 내용 |
| answer | string | | 관리자 답변 |
| is_answered | boolean | O | 답변 여부 (기본: false) |
| is_secret | boolean | | 비밀 질문 여부 (기본: false) |
| created_at | string | O | 작성일 |
| answered_at | string | | 답변일 |

### 코드 변경

#### Admin (`apps/admin`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `QnA` 타입 추가 |
| `src/lib/constants.ts` | `QNA_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toQnAs()` 변환 함수 추가 |
| `src/routes/qna/index.tsx` | Q&A 관리 페이지 (목록 + 답변 작성) |
| `src/components/layout/Sidebar.tsx` | Q&A 메뉴 추가 |

#### Shop (`apps/shop`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `QnA` 타입 추가 |
| `src/lib/constants.ts` | `QNA_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toQnAs()` 변환 함수 추가 |
| `src/components/product/ProductQnA.tsx` | Q&A 컴포넌트 (질문 목록 + 작성 폼) |
| `src/routes/products/$productId.tsx` | Q&A 컴포넌트 추가 |
| `src/lib/i18n/ko.ts` | `qna` 섹션 추가 |
| `src/lib/i18n/en.ts` | `qna` 섹션 추가 |

### i18n 키

```ts
// ko.ts
qna: {
  title: '상품 문의',
  writeQuestion: '문의 작성',
  noQuestions: '등록된 문의가 없습니다',
  beFirstQuestion: '첫 번째 문의를 작성해보세요!',
  questionPlaceholder: '상품에 대해 궁금한 점을 작성해주세요...',
  submit: '문의 등록',
  loginRequired: '문의를 작성하려면 로그인이 필요합니다.',
  contentRequired: '문의 내용을 입력해주세요.',
  submitFailed: '문의 등록에 실패했습니다.',
  deleteConfirm: '문의를 삭제하시겠습니까?',
  answered: '답변완료',
  waiting: '답변대기',
  secret: '비밀글',
  secretQuestion: '비밀 문의로 작성',
  answer: '답변',
  questionCount: '{count}개 문의',
}

// en.ts
qna: {
  title: 'Product Q&A',
  writeQuestion: 'Ask a Question',
  noQuestions: 'No questions yet',
  beFirstQuestion: 'Be the first to ask!',
  questionPlaceholder: 'Ask a question about this product...',
  submit: 'Submit',
  loginRequired: 'Please log in to ask a question.',
  contentRequired: 'Please enter your question.',
  submitFailed: 'Failed to submit question.',
  deleteConfirm: 'Delete this question?',
  answered: 'Answered',
  waiting: 'Waiting',
  secret: 'Secret',
  secretQuestion: 'Mark as secret',
  answer: 'Answer',
  questionCount: '{count} questions',
}
```

### 구현 로직

- Shop: 로그인 유저만 질문 작성 가능
- 비밀글은 본인 + 관리자만 열람 가능 (`is_secret: true && member_id !== currentUser`)
- Admin: 미답변 문의 우선 표시, 인라인 답변 입력
- 답변 작성 시 `is_answered: true`, `answered_at: new Date().toISOString()` 업데이트

---

## 2. 배너 관리 (CMS)

### 개요
Admin에서 홈 히어로 배너와 프로모션 배너를 관리하고, Shop 홈에 동적으로 표시.

### MCP 작업: `banners` 테이블 생성

DB: `c8999c12-b17c-4bc9-b0cb-5aa0cb21eaf4`

| 칼럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | O | 배너 제목 |
| subtitle | string | | 부제목 |
| image | string | O | 배너 이미지 URL |
| mobile_image | string | | 모바일용 이미지 URL |
| link_url | string | | 클릭 시 이동 URL |
| link_type | string | | `internal` / `external` (기본: internal) |
| position | string | O | `hero` / `promotion` / `popup` |
| sort_order | number | | 정렬 순서 (기본: 0) |
| is_active | boolean | O | 활성 여부 (기본: true) |
| starts_at | string | | 표시 시작일 |
| ends_at | string | | 표시 종료일 |
| created_at | string | O | 생성일 |

### 코드 변경

#### Admin (`apps/admin`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `Banner` 타입 추가 |
| `src/lib/constants.ts` | `BANNERS_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toBanners()` 변환 함수 추가 |
| `src/routes/banners/index.tsx` | 배너 관리 (목록 + CRUD) |
| `src/routes/banners/new.tsx` | 배너 생성 |
| `src/routes/banners/$bannerId.edit.tsx` | 배너 수정 |
| `src/components/banners/BannerForm.tsx` | 배너 폼 (이미지 업로드, 날짜 선택) |
| `src/components/layout/Sidebar.tsx` | 배너 메뉴 추가 |

#### Shop (`apps/shop`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `Banner` 타입 추가 |
| `src/lib/constants.ts` | `BANNERS_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toBanners()` 변환 함수 추가 |
| `src/components/home/HeroBanner.tsx` | DB에서 배너 데이터 로드하도록 수정 |
| `src/routes/index.tsx` | 배너 데이터 로더 추가 |

### 구현 로직

- Admin: 배너 이미지를 File Storage에 업로드 (`cb.storage.uploadFile`)
- Admin: 드래그앤드롭 정렬 또는 sort_order 입력으로 순서 관리
- Shop HeroBanner: `position === 'hero'`인 활성 배너를 슬라이더로 표시
- 날짜 기반 자동 활성/비활성: `starts_at <= now <= ends_at`
- 모바일 반응형: `mobile_image`가 있으면 모바일에서 별도 이미지 표시

---

## 3. 타임 세일 / 기획전

### 개요
관리자가 기간 한정 할인 이벤트를 등록하고, Shop에서 카운트다운과 함께 표시.

### MCP 작업: `promotions` 테이블 생성

DB: `c8999c12-b17c-4bc9-b0cb-5aa0cb21eaf4`

| 칼럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | O | 프로모션 제목 |
| description | string | | 설명 |
| image | string | | 커버 이미지 |
| discount_type | string | O | `fixed` / `percent` |
| discount_value | number | O | 할인 금액 또는 % |
| max_discount | number | | 최대 할인액 (percent일 때) |
| target_type | string | O | `all` / `category` / `products` |
| target_value | string | | 카테고리명 또는 쉼표 구분 상품 ID |
| product_ids | array | | 대상 상품 ID 목록 |
| starts_at | string | O | 시작일시 |
| ends_at | string | O | 종료일시 |
| is_active | boolean | O | 활성 여부 (기본: true) |
| sort_order | number | | 정렬 (기본: 0) |
| created_at | string | O | 생성일 |

### 코드 변경

#### Admin (`apps/admin`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `Promotion` 타입 추가 |
| `src/lib/constants.ts` | `PROMOTIONS_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toPromotions()` 변환 함수 추가 |
| `src/routes/promotions/index.tsx` | 프로모션 관리 (목록 + 활성/종료 상태 표시) |
| `src/routes/promotions/new.tsx` | 프로모션 생성 |
| `src/routes/promotions/$promotionId.edit.tsx` | 프로모션 수정 |
| `src/components/promotions/PromotionForm.tsx` | 폼 (날짜피커, 상품 선택, 할인 설정) |
| `src/components/layout/Sidebar.tsx` | 프로모션 메뉴 추가 |

#### Shop (`apps/shop`)
| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `Promotion` 타입 추가 |
| `src/lib/constants.ts` | `PROMOTIONS_TABLE_ID` 추가 |
| `src/lib/utils.ts` | `toPromotions()` + `getDiscountedPrice()` 함수 |
| `src/routes/promotions/index.tsx` | 진행중 프로모션 목록 페이지 |
| `src/routes/promotions/$promotionId.tsx` | 프로모션 상세 (대상 상품 + 카운트다운) |
| `src/components/home/TimeSale.tsx` | 홈 타임세일 섹션 (카운트다운 타이머) |
| `src/components/ui/CountdownTimer.tsx` | 카운트다운 타이머 컴포넌트 |
| `src/components/ui/ProductCard.tsx` | 할인가 표시 로직 추가 (취소선 원가 + 할인가) |
| `src/routes/index.tsx` | 타임세일 섹션 추가 |
| `src/lib/i18n/ko.ts` | `promotion` 섹션 추가 |
| `src/lib/i18n/en.ts` | `promotion` 섹션 추가 |

### i18n 키

```ts
// ko.ts
promotion: {
  title: '타임세일',
  ongoing: '진행중',
  ended: '종료',
  upcoming: '예정',
  endsIn: '종료까지',
  startsIn: '시작까지',
  days: '일',
  hours: '시간',
  minutes: '분',
  seconds: '초',
  viewProducts: '상품 보기',
  discountBadge: '{value}% OFF',
  noPromotions: '진행중인 프로모션이 없습니다',
}

// en.ts
promotion: {
  title: 'Time Sale',
  ongoing: 'Ongoing',
  ended: 'Ended',
  upcoming: 'Upcoming',
  endsIn: 'Ends in',
  startsIn: 'Starts in',
  days: 'd',
  hours: 'h',
  minutes: 'm',
  seconds: 's',
  viewProducts: 'View Products',
  discountBadge: '{value}% OFF',
  noPromotions: 'No active promotions',
}
```

### 구현 로직

- Admin: 상품 선택 시 검색 + 체크박스로 다중 선택
- Shop: `starts_at <= now <= ends_at && is_active`인 프로모션만 표시
- 카운트다운: `useEffect` + `setInterval(1초)`로 실시간 갱신
- ProductCard: 프로모션 대상 상품이면 할인가 계산 후 `할인뱃지 + 취소선 원가 + 할인가` 표시
- 홈 타임세일 섹션: 가장 빠르게 종료되는 프로모션 1개를 하이라이트

---

## 구현 순서 (MCP 복구 후)

```
1. MCP 연결 확인
2. 기존 칼럼 존재 여부 확인 (섹션 0)
   → 없으면 create_column으로 추가
3. 기능 1: Q&A 테이블 생성 → Admin/Shop 코드 구현
4. 기능 2: Banners 테이블 생성 → Admin/Shop 코드 구현
5. 기능 3: Promotions 테이블 생성 → Admin/Shop 코드 구현
6. 빌드 + 배포
   - pnpm -F admin build
   - pnpm -F @shop/web build
   - cd apps/admin && npx connectbase-client deploy ./dist
   - cd apps/shop && npx connectbase-client deploy ./dist
```

---

## 이미 구현 완료된 기능 목록

- [x] 상품 옵션/사이즈 (variants)
- [x] 상품 정렬 (최신순/가격순)
- [x] 배송 추적 (택배사 + 운송장)
- [x] 반품/교환 프로세스
- [x] 리뷰 이미지 업로드
- [x] 최근 본 상품
- [x] 주문 엑셀(CSV) 다운로드
- [x] SNS 공유 버튼
- [x] 약관 동의 + 사업자 정보 푸터
- [x] 게시판 시스템 (Admin CRUD + Shop 표시 + 동적 네비)
- [x] 페이지 시스템 (Admin CRUD + Shop 표시)
- [x] 네비게이션 관리
- [x] 유저 글쓰기 허용 (게시판)
- [x] 비밀글 기능
- [x] 쿠폰 시스템
- [x] 마일리지 시스템
- [x] 인플루언서 시스템
