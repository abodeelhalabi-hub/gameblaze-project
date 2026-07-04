Gameblaze fix summary

- Fixed Vite proxy configuration in `artifacts/games/vite.config.ts` so `API_PROXY_TARGET` defaults to `http://localhost:4001`.
- Verified frontend runs successfully on `http://localhost:3000`.
- Verified backend API server responds on `http://localhost:4001` and health endpoint `/api/healthz` returns `200`.
- Confirmed the frontend proxy path forwards `/api` requests to the backend.
- Fixed dark/light mode toggle button in `artifacts/games/src/components/Sidebar.tsx` so the switch knob is centered correctly.
- Current setup uses local API storage fallback and admin auth route at `/api/admin/auth`.
