# frontend

SprintWell single-page app. React 19 + TypeScript + Vite 6 + Tailwind v4 + shadcn/ui (new-york, neutral). Public read-only views plus authenticated member/admin flows per brief §4.4, §10.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc -b && vite build → dist/
npm run preview      # serve the built dist/
npm test             # Vitest watch mode
npm run test:run     # Vitest single run (what CI executes)
npm run lint         # eslint --max-warnings 0
npm run format       # prettier --write .
```

Requires Node `>=20`.

## Layout

```
frontend/
├── index.html                  # Vite entry
├── vite.config.ts              # @vitejs/plugin-react + @tailwindcss/vite
├── vitest.config.ts            # mergeConfig over vite.config (jsdom + setup)
├── tsconfig.json               # project references → app + node
├── tsconfig.app.json           # strict + noUncheckedIndexedAccess
├── tsconfig.node.json          # for vite.config / vitest.config
├── eslint.config.mjs           # flat config (TS + react + hooks + jsx-a11y)
├── components.json             # shadcn config (new-york / neutral)
├── src/
│   ├── main.tsx                # ReactDOM root, StrictMode, <App />
│   ├── App.tsx                 # createBrowserRouter + RouterProvider
│   ├── index.css               # @import 'tailwindcss' + @theme inline tokens
│   ├── vite-env.d.ts
│   ├── components/ui/button.tsx
│   ├── lib/
│   │   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
│   │   └── http.ts             # request<T>() + HttpError, ~30 lines
│   └── routes/Home.tsx
└── tests/
    ├── setup.ts                # @testing-library/jest-dom/vitest
    └── App.test.tsx            # renders the Button on Home
```

Tests live under `frontend/tests/`, not co-located (brief §14).

## Environment

`VITE_API_URL` (default `http://localhost:3000`) — the backend HTTP base URL consumed by `src/lib/http.ts`. Only `VITE_*` vars are exposed to client code.

## TypeScript strictness (vs backend)

Frontend enables `strict: true` and `noUncheckedIndexedAccess: true` but intentionally **omits** `exactOptionalPropertyTypes`. React idioms pass `prop={maybeUndefined}` through JSX constantly; enforcing exact-optional would force defensive `&&` checks throughout component code with no real bug-prevention upside. Backend keeps `exactOptionalPropertyTypes` on because object-shape boundaries (DTOs, repository contracts) are exactly where its protection pays off. The asymmetry is deliberate.

## Stack notes

- **Tailwind v4** CSS-first: no `tailwind.config.js`, no `postcss.config`. Theme tokens live in `src/index.css` (`@theme inline`).
- **shadcn/ui** new-york, neutral. Only `Button` is installed; add more with `npx shadcn@latest add <component>`.
- **react-router v7** library mode (single `react-router` package, no `react-router-dom`). `createBrowserRouter` + `RouterProvider`.
- **fetch wrapper** in `src/lib/http.ts` — no axios; one `request<T>()` function + `HttpError`.
- **No state library** yet (no Redux / TanStack Query). The HTTP wrapper is the entire boundary.
