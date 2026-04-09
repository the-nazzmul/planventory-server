/**
 * Integration tests for the Express + Prisma API (Vitest + Supertest).
 *
 * These cases are placeholders until a test database and full env (see `src/config/env.ts`)
 * are configured. JWT auth uses RS256 access tokens via `Authorization: Bearer <token>`.
 * All routes live under `/api/v1`.
 *
 * To implement: set `NODE_ENV=test` and required env vars, run migrations against a test DB,
 * seed users/products as needed, then replace `.todo` / `.skip` with real assertions.
 * Use `const { createApp } = await import('../../src/app.js')` inside tests so the app module
 * (and env validation) loads only when tests run.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('API integration (placeholders)', () => {
  describe.skip('Supertest + app wiring', () => {
    it.skip('documents using createApp() with Supertest (un-skip when env + DB exist)', async () => {
      const { createApp } = await import('../../src/app.js');
      const app = createApp();
      await request(app).get('/api/v1/health');
    });
  });

  describe('Auth module', () => {
    it.todo(
      'POST /api/v1/auth/login with valid credentials returns 200 and a body containing accessToken',
    );
    it.todo('POST /api/v1/auth/login with invalid password returns 401');
    it.todo(
      'POST /api/v1/auth/refresh rotates the refresh cookie (Set-Cookie) and returns new tokens as applicable',
    );
    it.todo(
      'POST /api/v1/auth/logout clears the refresh cookie and revokes the refresh token family',
    );
    it.todo(
      'PATCH /api/v1/auth/change-password with valid current password succeeds (e.g. 204 or 200)',
    );
    it.todo(
      'PATCH /api/v1/auth/change-password invalidates all existing sessions (access/refresh families)',
    );
  });

  describe('Products module', () => {
    it.todo(
      'POST /api/v1/products creates a product and its variants in one transaction (atomic)',
    );
    it.todo(
      'GET /api/v1/products/:id returns the product with variants, images, category, and brand',
    );
    it.todo(
      'PATCH /api/v1/products/:id/variants/:variantId/stock creates a StockMovement (and updates stock)',
    );
    it.todo('POST /api/v1/products with a duplicate SKU returns an error response (e.g. 409)');
    it.todo(
      'POST /api/v1/products with a fractional costPrice returns 422 (validation)',
    );
  });

  describe('Orders module', () => {
    it.todo(
      'POST /api/v1/orders creates an order and decrements stock for reserved line items',
    );
    it.todo(
      'POST /api/v1/orders with the same idempotencyKey returns the existing order with 200',
    );
    it.todo('POST /api/v1/orders with insufficient stock returns 409');
    it.todo(
      'PATCH /api/v1/orders/:id/status with an invalid status transition returns 400',
    );
    it.todo(
      'Cancelling an order releases stock and creates ADJUSTMENT stock movements',
    );
  });

  describe('Finance module', () => {
    it.todo('POST /api/v1/expenses creates an expense record');
    it.todo('PUT /api/v1/expenses/:id returns 404 (route does not exist)');
    it.todo('DELETE /api/v1/expenses/:id returns 404 (route does not exist)');
    it.todo(
      'GET /api/v1/finance/overview with MANAGER role returns 403 (forbidden)',
    );
    it.todo(
      'GET /api/v1/finance/overview returns all monetary values as integers (e.g. minor units)',
    );
  });

  describe.skip('Tooling', () => {
    it.skip('supertest request helper is available for future integration tests', () => {
      expect(request).toBeDefined();
      expect(typeof request).toBe('function');
    });
  });
});
