# B100 Intelligence Frontend

Next.js 14 frontend for the B100 Intelligence financial platform.

## Setup

```bash
cd frontend
npm install
npm run dev
```

The app expects the Django backend to be running at:

```text
http://127.0.0.1:8000
```

## Notes

- Token login uses the backend token endpoint and stores the token in `localStorage`.
- Browser API requests are made through `lib/api.ts`.
- Protected routes redirect unauthenticated users to `/login`.
- The app uses Material UI v5, Axios, Recharts, and TypeScript.

