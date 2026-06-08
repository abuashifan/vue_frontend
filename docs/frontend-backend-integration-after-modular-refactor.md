# Frontend Backend Integration After Modular Refactor

## Backend Route Summary

The Laravel backend now loads API routes through explicit module route files under `app/Modules/*/Routes/api.php`. The public API contract remains unchanged: URLs still live under `/api`, protected tenant routes still require Sanctum auth and company access, and tenant requests still use `X-Company-ID`.

The backend route list was verified after the modular route split and still reports 318 API routes.

## Frontend Integration Checks

- API base URL is configured by `VITE_API_URL` in `src/services/api.ts`.
- The current dev default uses `VITE_API_URL=/api` with the Vite proxy target from `VITE_API_PROXY_TARGET`.
- A direct backend API example is documented as `VITE_API_URL=http://127.0.0.1:8000/api`.
- Requests go through the shared Axios client exported from `src/services/api.ts` and `src/api.ts`.
- Static audit found no direct `fetch()` API bypass for backend business endpoints.
- Static route comparison found one stale endpoint reference and it was fixed.

## API Client Behavior

`applyApiRequestHeaders` sets:

- `Accept: application/json` on every request.
- `Content-Type: application/json` when a request body exists and the body is not `FormData`.
- `Authorization: Bearer <token>` when an auth token is available.
- `X-Company-ID: <active_company_id>` on non-public API requests when an active company exists.

Response handling normalizes Laravel API errors. `401` clears invalid auth and redirects to login. Company access errors clear invalid company state and redirect to company selection. `403`, `422`, and network errors are normalized into readable messages for pages and forms.

## Auth, Company, Permission Flow

- Login calls `POST /api/auth/login` through `authApi.login`.
- The token and user are stored in `authStore`.
- Company list loads through `GET /api/companies`.
- Company selection calls `POST /api/companies/select`.
- Active company is stored in `companyStore`.
- Company switch clears permissions and invalidates tenant-scoped workspace/access state before permissions are refreshed.
- Permissions load through `GET /api/auth/permissions` after a company is active.
- Sidebar and route guards use stored permissions for visibility and access.
- Logout clears auth, company state, permissions, and tenant-scoped workspace/list/form state.

## Endpoint Groups Verified

- Auth: `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/permissions`.
- Company and tenant: `/companies`, `/companies/select`, `/tenant-context-test`.
- Access: `/access/*`.
- Settings: `/settings/company*`.
- Accounting: `/accounting/fiscal-year/status`, `/accounting/fiscal-years/*`, `/accounting/period-locks*`.
- Master data: `/master-data/chart-of-accounts`, `/master-data/contacts`, `/master-data/payment-terms`, `/master-data/units`, `/master-data/product-categories`, `/master-data/products`, `/master-data/warehouses`, `/master-data/departments`, `/master-data/projects`, `/master-data/account-mappings`.
- Journal: `/journals*`.
- Reports: `/reports/*`.
- Sales: `/sales/*`.
- Purchase: `/purchase/*`.
- Cash bank: `/cash-bank/*`.
- Inventory: `/inventory/*`.

## Fixed Endpoint Mismatches

| Location | Before | After | Reason |
| --- | --- | --- | --- |
| `src/navigation/sidebar.ts` | `/reports/general-ledger-detail` | `/reports/general-ledger` | `/reports/general-ledger-detail` is not a backend API route. Account ledger detail is parameterized as `/reports/account-ledger/{account}`, so the top-level menu item now points to the available general ledger endpoint instead of a stale path. |

## Manual QA Checklist

- Login page can authenticate against backend.
- Select company page loads companies and selects an active company.
- Dashboard loads tenant-aware data with `X-Company-ID`.
- Sidebar menu reflects loaded permissions.
- Master Data list loads, for example Chart of Accounts or Contacts.
- Journal list loads.
- Reports workspace loads Profit Loss or General Ledger.
- Sales invoice list loads.
- Purchase bill list loads.
- Cash bank account statement loads.
- Inventory stock balance loads.
- Access management pages load.
- Company settings page loads.
- Fiscal closing and period lock views load.

## Remaining Notes

Browser smoke testing still requires a running backend, seeded data, and a valid login. No backend business logic, database schema, API response format, frontend layout, sidebar design, virtual tabs, or workspace layout was refactored for this audit.
