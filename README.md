# local_connect — developer quick start

Prereqs:
- Node 18+ and npm
- PostgreSQL accessible by `DATABASE_URL` in `.env`

Quick start:

1. Install dependencies for server and client:

```bash
npm run install:all
```

2. Create `.env` from example and generate secrets:

```bash
cp server/.env.example server/.env
cd server
npm run gen:env
```

3. Generate Prisma client and seed demo data:

```bash
cd server
npm run db:generate
npm run db:seed
```

4. Start both dev servers together:

```bash
npm run dev
```

Notes:
- The frontend expects the backend chatbot adapter at `http://localhost:3000/api/chatbot/search`.
- Copy `client/.env.example` to `client/.env` and update `VITE_API_BASE` if your backend is running on a different host or port.
- The client also supports an optional `VITE_API_TOKEN` bearer token for backend auth.
- If you prefer separate terminals, run `npm run dev` in `server` and `client` individually.
