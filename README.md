# Planventory Server

Production-grade inventory management backend built with Express.js, TypeScript, Prisma, PostgreSQL (Neon), Redis (Upstash), and S3 (Cloudflare R2).

## Prerequisites

- Node.js 22+
- PostgreSQL (or Neon serverless)
- Redis (or Upstash)
- Cloudflare R2 bucket (for image storage)

## Local Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in all values.
3. Generate RS256 key pair for JWT:
   ```bash
   node -e "const c=require('crypto');const{privateKey,publicKey}=c.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'pkcs1',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});console.log(privateKey);console.log(publicKey);"
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
6. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
7. Seed the database:
   ```bash
   npx prisma db seed
   ```
8. Start the development server:
   ```bash
   npm run dev
   ```

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production server |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Lint source files with ESLint |
| `npm test` | Run tests with Vitest |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /health | - | Health check |
| POST | /auth/login | - | Login |
| POST | /auth/refresh | - | Refresh access token |
| POST | /auth/logout | Bearer | Logout |
| PATCH | /auth/change-password | Bearer | Change password |
| GET/POST/PATCH/DELETE | /users | SUPER_ADMIN | User management |
| GET/POST/PATCH/DELETE | /categories | ADMIN/MANAGER | Category CRUD |
| GET/POST/PATCH/DELETE | /brands | ADMIN/MANAGER | Brand CRUD |
| GET/POST/PATCH/DELETE | /products | ADMIN/MANAGER | Product CRUD |
| PATCH | /products/:id/variants/:vid/stock | +WAREHOUSE | Stock update |
| GET | /stock-movements | All roles | Stock movement log |
| GET/POST/PATCH/DELETE | /suppliers | ADMIN/MANAGER | Supplier CRUD |
| GET/POST/PATCH | /purchase-orders | ADMIN/MANAGER | Purchase orders |
| POST | /purchase-orders/:id/receive | ADMIN/MANAGER | Receive PO |
| GET/POST | /orders | ADMIN/MANAGER | Order management |
| PATCH | /orders/:id/status | ADMIN/MANAGER | Update order status |
| GET/POST | /returns | ADMIN/MANAGER | Return processing |
| GET/POST | /expenses | SUPER_ADMIN | Expense ledger |
| GET | /finance/overview | SUPER_ADMIN | Financial overview |
| GET | /finance/reports | SUPER_ADMIN | Monthly reports |
| GET/PATCH | /settings | SUPER_ADMIN | System settings |
| GET/POST/DELETE | /webhooks | SUPER_ADMIN | Webhook subscriptions |

## Deployment (Render + Neon + Upstash + R2)

1. Create a Neon PostgreSQL database and get `DATABASE_URL` and `DIRECT_URL`.
2. Create an Upstash Redis database and get `REDIS_URL` and `REDIS_TOKEN`.
3. Create a Cloudflare R2 bucket and generate API keys.
4. Deploy to Render using the `render.yaml` blueprint — set all environment variables.
5. Render will automatically run migrations and start the server.
