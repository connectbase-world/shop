# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 구조 (모노레포)

pnpm workspace 기반 모노레포 구조이다.

```
/ (루트)
├── apps/
│   └── shop/          # 쇼핑몰 프론트엔드 (@shop/web)
├── packages/          # 공유 패키지 (향후 추가)
├── pnpm-workspace.yaml
└── package.json       # 루트 워크스페이스 스크립트
```

## 명령어

### 루트에서 실행
- **shop 개발 서버:** `pnpm dev` 또는 `pnpm dev:shop` (포트 3000)
- **shop 빌드:** `pnpm build` 또는 `pnpm build:shop`
- **전체 빌드:** `pnpm build:all`
- **특정 앱 명령:** `pnpm -F @shop/web <script>`

### apps/shop 내에서 실행
- **개발 서버:** `pnpm dev` (포트 3000)
- **빌드:** `pnpm build`
- **프로덕션 미리보기:** `pnpm preview`
- **테스트:** `pnpm test` (vitest)
- **배포:** `pnpm deploy` (빌드 후 ConnectBase에 배포)

## 아키텍처

### 기술 스택

- **React 19** + **TanStack Router** — 파일 기반 라우팅
- **Vite 7** — 빌드 도구 및 개발 서버
- **TypeScript** — strict 모드, ES2022 타겟
- **Tailwind CSS v4** — 스타일링 (Vite 플러그인 방식)
- **Vitest** + **Testing Library** — 테스트
- **lucide-react** — 아이콘
- **connectbase-client** — 백엔드 연동

### 라우팅 (apps/shop)

라우트 파일은 `apps/shop/src/routes/`에 `.tsx` 파일로 정의한다. TanStack Router가 파일 구조를 기반으로 `src/routeTree.gen.ts`를 자동 생성하므로 이 파일을 직접 수정하면 안 된다.

- `src/routes/__root.tsx` — 모든 라우트를 감싸는 루트 레이아웃 (`<Outlet />` 렌더링)
- `src/routes/index.tsx` — 홈 페이지 (`/`)
- 새 라우트 추가: `src/routes/`에 파일 생성 (예: `about.tsx` → `/about`)
- SPA 내비게이션은 `@tanstack/react-router`의 `<Link>` 컴포넌트 사용
- 라우터 설정: `defaultPreload: 'intent'` (호버 시 프리로드), `scrollRestoration: true`

### 경로 별칭

`@/*`는 `src/*`로 해석된다 (tsconfig.json에서 설정, vite-tsconfig-paths로 적용).

### 진입점

`index.html` → `src/main.tsx`에서 자동 생성된 라우트 트리로 라우터를 생성하고 `#app`에 렌더링한다.

## ConnectBase SDK 개발 가이드

ConnectBase SDK 사용법, MCP 자동화 워크플로우, 파일 저장 정책, 각 기능별 API 레퍼런스는 아래 파일을 참고한다.

→ `.claude/default_develop_rules.md`
