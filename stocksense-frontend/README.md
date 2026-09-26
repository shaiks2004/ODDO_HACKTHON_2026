# StockSense Frontend

React 19, TypeScript, and Vite client for the StockSense inventory API.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the reachable backend origin in `.env`. The frontend contains no database or backend secrets. The development server runs on port 3000, which is included in the backend's local CORS defaults.

## Commands

```powershell
npm run typecheck
npm run lint
npm run build
```

Swagger/OpenAPI for the backend is served at the API origin's `/docs` and `/openapi.json`.

## Contract notes

- Authentication uses the current signup/login/refresh endpoints. Access and refresh tokens are kept in `sessionStorage` and rotated through `/auth/refresh` after an expired access token.
- Receipts, deliveries, transfers, and adjustments only call their backend document APIs; browser code never writes inventory quantities.
- Low-stock status and reorder suggestions come from `/alerts/low-stock`.
- The current backend does not expose profile or JSON report APIs. CSV report routes depend on the Phase 3 report provider and may return `503` until it is integrated.# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
