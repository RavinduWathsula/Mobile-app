# Sawingir Hills Hotel Management System

Sawingir Hills Hotel Management System is a full-stack hotel operations platform built with React, Express, Prisma, and MySQL.

This repository now has two real end-to-end slices wired to the backend:
- hotel core operations: login, dashboard, users, booking, arrivals/check-in, checkouts/check-out
- restaurant v1: menu/category CRUD, admin-managed table service, live settings, QR menu publishing, held tabs, kitchen execution, split payments, and print-ready order flow

Other pages still exist for ongoing university/project work, but unfinished modules stay hidden from production navigation by default.

## Current Status

What is fully real today:
- server-side RBAC on sensitive API routes
- login with short-lived access token plus httpOnly refresh cookie rotation
- real users management backed by the API
- real booking creation backed by room-type availability checks
- server-side booking price calculation
- real arrivals and checkouts lists
- live dashboard data with no fake KPI fallback in production paths
- restaurant menu category CRUD backed by `/api/restaurant/*`
- live restaurant POS order creation backed by server-calculated totals
- admin-managed restaurant tables instead of hardcoded table slots
- waiter-friendly table board with active, held, and payment-due states
- held tabs plus add-to-order/resume flow on the server-backed order API
- live kitchen workflow with backend item-status propagation
- split and partial payment capture through `PATCH /api/restaurant/orders/:id/payment`
- live restaurant settings for tax, service, modifier presets, and QR publishing
- public QR menu backed by live menu/categories/settings instead of mock data
- print-ready kitchen tickets and guest receipts from the POS screen
- void request / manager approval plus refund-note workflow for demos
- repeatable demo seed data for lecturer/client walkthroughs

What is intentionally not presented as production-ready:
- prototype event, day-out, and roles UI flows that still need full API hardening
- restaurant image handling is URL-based for now, not a full managed upload/storage pipeline

To reveal unfinished prototype routes during development, set:

```env
VITE_ENABLE_PROTOTYPE_MODULES=true
```

## Tech Stack

Frontend:
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Recharts

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM
- MySQL
- Zod validation
- JWT auth
- Helmet
- express-rate-limit
- bcryptjs

## Architecture Notes

Security and auth:
- access tokens are kept in memory on the client
- refresh tokens are stored in an httpOnly cookie
- refresh flow is handled by `/api/auth/refresh`
- `JWT_SECRET` is required at startup

Booking integrity:
- sensitive totals are calculated on the server
- room-type availability is checked against overlapping bookings
- room-specific conflicts are validated server-side

Restaurant integrity:
- restaurant totals are calculated on the server, not trusted from the client
- room-service orders must resolve a real checked-in booking
- booking, guest, and room linkage is validated server-side
- held tabs stay out of the kitchen queue until staff release them
- split payments are stored against order invoices instead of only in local UI state
- kitchen item progression updates the parent order status automatically
- order completion is finalized through the payment endpoint, not a local UI fallback

Navigation and delivery:
- the real slices are visible by default
- unfinished prototype modules are hidden unless explicitly enabled
- major routed pages are lazy-loaded to reduce the initial bundle
- restaurant navigation is guarded in both the client shell and the API by role

## Prerequisites

Install these first:
- Node.js 18+
- MySQL 8+ or XAMPP MariaDB/MySQL
- Git

If you are using XAMPP, make sure MySQL is actually running before setup.

## Environment Setup

### Root `.env`

```env
VITE_API_URL=http://localhost:3010/api
# Optional: expose unfinished prototype routes during development only
# VITE_ENABLE_PROTOTYPE_MODULES=true
```

### `server/.env`

```env
DATABASE_URL="mysql://root:@localhost:3306/sawingir_hills_hms"
PORT=3010
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-this-with-a-real-secret
LOG_LEVEL=info
```

Notes:
- update `DATABASE_URL` to match your MySQL username/password
- `CLIENT_URL` must match the frontend origin because auth uses cookies
- use a strong `JWT_SECRET` outside local development

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/Sawingir-Hills-Hotel-Management-System.git
cd Sawingir-Hills-Hotel-Management-System
npm install
cd server
npm install
cd ..
```

### 2. Create the database

```sql
CREATE DATABASE sawingir_hills_hms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. One-command demo setup

This is the easiest setup path for lecturer/client demos:

```bash
npm run demo:setup
```

It runs:
- Prisma client generation
- schema push
- demo seed data

### 4. Start the app

Run these in two terminals.

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
npm run dev
```

Frontend URL:
- `http://localhost:5173/login`

Backend health check:
- `http://localhost:3010/api/health`

## Production Deployment on cPanel

### Important hosting requirement

This is not a PHP-only application. Production requires:

- cPanel **Application Manager** or **Setup Node.js App** with Node.js 20 or newer
- MySQL/MariaDB database access
- SSL for both frontend and API domains
- cPanel Terminal/SSH, or an equivalent interface for running npm and Prisma commands

If the hosting package only supports PHP and static files, the React frontend can be hosted there, but the Express API cannot. In that case, host the API on a Node-capable VPS or platform and point VITE_API_URL to it.

Recommended domain layout:

- frontend: https://hms.example.com
- API: https://api-hms.example.com

Use domains under the same parent domain. The refresh token is an httpOnly, secure, SameSite=Lax cookie, so unrelated frontend and API domains will not work without changing and re-reviewing the cookie policy.

### 0. Protect secrets before deployment

The repository previously tracked local environment files. The .gitignore rules now ignore environment files, but ignore rules do not remove files already present in Git history.

Before publishing the repository or giving another person access:

~~~bash
git rm --cached .env .env.production server/.env
git commit -m "Stop tracking environment files"
~~~

This keeps local copies on disk. It does not erase secrets from older commits, so rotate the database password and JWT_SECRET after untracking them. Never upload environment files into a public web directory.

### 1. Create the production domains and SSL

In cPanel:

1. Create hms.example.com for the frontend.
2. Create api-hms.example.com for the backend.
3. Enable AutoSSL and confirm both URLs open over HTTPS.
4. Use one canonical frontend origin. Do not mix hms.example.com and www.hms.example.com.

Replace the example domains with the real domains throughout the remaining steps.

### 2. Create the MySQL database

Open **MySQL Databases** in cPanel and:

1. Create a database, for example cpuser_sawingir_hms.
2. Create a dedicated database user.
3. Add the user to the database with the required privileges.
4. Save the generated database name, username, and password.

A typical cPanel connection string is:

~~~env
DATABASE_URL="mysql://cpuser_dbuser:URL_ENCODED_PASSWORD@localhost:3306/cpuser_sawingir_hms"
~~~

cPanel normally prefixes database and user names with the account username. URL-encode special characters in the password before placing it in DATABASE_URL.

### 3. Build and upload the frontend

Create a root .env.production file on the development machine:

~~~env
VITE_API_URL=https://api-hms.example.com/api
VITE_ENABLE_PROTOTYPE_MODULES=false
~~~

Then build locally from the repository root:

~~~bash
npm ci
npm run build
~~~

VITE_API_URL is compiled into the frontend bundle. Changing a cPanel environment variable later will not change an already-built frontend; rebuild and upload it again.

Upload the **contents** of dist/ to the document root for hms.example.com. Do not upload the dist directory as an extra nested folder.

Add this .htaccess file to the frontend document root so direct visits to routes such as /login, /restaurant-pos, and /qr-menu return the React application:

~~~apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
~~~

The current Vite configuration expects deployment at a domain root. Hosting the frontend inside a path such as example.com/hms/ requires an explicit Vite base path and router changes, so a subdomain is recommended.

### 4. Upload and build the API

Create an application directory outside public_html, for example:

~~~text
/home/cpuser/sawingir-hms-api
~~~

Upload the contents of server/ into that directory. Do not upload Windows node_modules, local logs, or server/.env.

In cPanel Terminal or SSH:

~~~bash
cd ~/sawingir-hms-api
npm ci --include=dev
npm run db:generate
npm run build
~~~

Prisma Client must be generated on the Linux server. Copying node_modules from Windows can produce an incompatible Prisma engine.

The repository includes server/app.js as the Passenger startup wrapper. It loads the compiled dist/index.js API.

### 5. Configure the cPanel Node.js application

Open **Application Manager** or **Setup Node.js App** and register the API with:

- Node.js version: 20 or newer
- environment: Production
- application root: sawingir-hms-api
- application URL/domain: api-hms.example.com
- base URL: /
- startup file: app.js, if the interface asks for one

Add these application environment variables:

~~~env
NODE_ENV=production
CLIENT_URL=https://hms.example.com
DATABASE_URL=mysql://cpuser_dbuser:URL_ENCODED_PASSWORD@localhost:3306/cpuser_sawingir_hms
JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET
LOG_LEVEL=info
~~~

Generate a strong JWT secret in cPanel Terminal:

~~~bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
~~~

Use the generated value in cPanel; do not commit it. CLIENT_URL must exactly match the browser-visible frontend origin and should not have a trailing slash.
When using cPanel Terminal, first run the Node environment activation command shown by Setup Node.js App. If Prisma reports that DATABASE_URL is missing, the terminal session has not inherited the Application Manager variables. Activate the application environment or create a private .env inside the API application root, set its permissions to 600, run the schema command, and keep that file outside public_html and Git.

Do not force production port 3010 in cPanel unless the hosting provider explicitly requires it. Passenger normally supplies PORT and reverse-proxies HTTPS traffic to the Node application.

### 6. Initialize the database

This repository currently has no committed Prisma migration history. For the first deployment to a new, empty database, run:

~~~bash
cd ~/sawingir-hms-api
npm run db:push
~~~

Back up an existing database before running schema commands. Do not use --accept-data-loss on production unless the generated database changes have been reviewed and a verified backup exists.

For a private lecturer/client demo environment only, seed the demo records before removing development dependencies:

~~~bash
npm run db:seed
~~~

The seed creates predictable demonstration accounts. Do not expose those credentials on a public production system. For a real hotel deployment, create controlled production users instead of running the demo seed.

After schema setup and optional demo seeding:

~~~bash
npm prune --omit=dev
~~~

For future live releases, add and commit Prisma migrations, review their SQL, and use prisma migrate deploy. db push is suitable for the current first-time/demo setup but does not provide safe, versioned production migration history.

### 7. Restart and verify

Use cPanel's **Restart Application** action. If the interface does not provide one:

~~~bash
cd ~/sawingir-hms-api
mkdir -p tmp
touch tmp/restart.txt
~~~

Verify the API first:

~~~text
https://api-hms.example.com/api/health
~~~

A healthy response must report status "ok" and database "connected".

Then verify:

1. Open https://hms.example.com/login.
2. Sign in and refresh the browser; the session should remain active.
3. Open Dashboard and confirm live data loads.
4. Create a test booking.
5. Create a restaurant order and confirm it appears in Kitchen Display.
6. Open a frontend route directly in a new tab to confirm .htaccess fallback works.
7. Open the public QR menu without an authenticated session.

### Production security checklist

- HTTPS is active for both domains.
- NODE_ENV=production is set in the Node application.
- CLIENT_URL exactly matches the frontend origin.
- VITE_ENABLE_PROTOTYPE_MODULES=false was used during the frontend build.
- .env, .env.production, and server/.env are not tracked or publicly accessible.
- Database and JWT credentials were rotated after removing tracked env files.
- Demo credentials are not enabled on a public hotel system.
- Database backups are configured before future schema updates.
- Only dist/ is public for the frontend; API source and configuration stay outside public_html.
- The health endpoint reports a connected database.
- Login, refresh, logout, RBAC, booking, and restaurant flows were tested over HTTPS.

### Updating an existing cPanel deployment

For each release:

1. Back up the production database.
2. Upload or pull the updated source.
3. Reinstall backend dependencies with npm ci --include=dev.
4. Run npm run db:generate and npm run build inside the API directory.
5. Review and apply the required database migration/schema update.
6. Run npm prune --omit=dev.
7. Restart the Passenger application.
8. Rebuild the frontend with the production .env.production.
9. Replace the files in the frontend document root.
10. Re-run the health, login, dashboard, booking, and restaurant checks.

### Common cPanel problems

**Frontend shows Failed to fetch:**

- confirm VITE_API_URL used the public HTTPS API URL before the frontend build
- confirm the API health URL works
- confirm CLIENT_URL exactly matches the frontend origin
- rebuild the frontend after changing any VITE_* value

**Login works but refresh/logout fails:**

- confirm both domains use HTTPS
- confirm NODE_ENV=production
- confirm frontend and API use the same parent domain
- check that the browser accepted the refresh cookie and that requests include credentials

**API health returns database disconnected:**

- check the cPanel-prefixed database/user names
- check password URL encoding
- confirm the database user is assigned to the database
- confirm the database host, usually localhost

**API fails with a Prisma engine error:**

- delete uploaded Windows node_modules
- run npm ci --include=dev and npm run db:generate on the cPanel Linux server
- rebuild and restart the application

**Refreshing a frontend route returns 404:**

- confirm .htaccess is in the frontend document root
- confirm Apache rewrite rules are permitted by the hosting plan

**Application changes do not appear:**

- rebuild the relevant frontend or backend output
- restart the Node application or touch tmp/restart.txt
- clear the browser cache after replacing frontend assets

Official references:

- [cPanel Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/)
- [cPanel Passenger applications](https://docs.cpanel.net/knowledge-base/web-services/using-passenger-applications/)
- [Prisma db push](https://docs.prisma.io/docs/cli/db/push)
- [Prisma production migrations](https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)

## Demo Accounts

After `npm run demo:setup` or `npm run demo:seed`, sign in with these usernames and passwords:

- `dev / Dev@123` - full demo access for lecturer/client walkthroughs
- `admin / Admin@123` - administrator access to the real secured modules
- `manager / Manager@123` - manager-level operational access
- `frontoffice / FrontOffice@123` - front desk flow for bookings, arrivals, and checkouts
- `restaurantstaff / Restaurant@123` - restaurant POS, kitchen, and menu-management flow

## Suggested Demo Flow

For a lecturer, client, or viva presentation:

1. Log in as `frontoffice`.
2. Open the dashboard and explain that KPIs are live, not mocked.
3. Open arrivals and show the seeded guest arriving today.
4. Open checkouts and show the seeded in-house guest due out today.
5. Create a new booking and explain that availability and pricing are enforced server-side.
6. Check in the arrival and check out the in-house guest.
7. Log in as `restaurantstaff`.
8. Open Restaurant POS, place a real table order, and note the backend-generated order number/status.
9. Open Kitchen Display, move the ticket from pending to preparing to ready.
10. Return to Restaurant POS, mark the order served, then finalize payment.
11. Open Restaurant Back Office and show the live categories/menu items backing the POS.
12. Log in as `dev` or `admin` and open users plus dashboard to show RBAC and operational visibility.

## Available Scripts

### Root scripts

- `npm run dev` - start the Vite frontend
- `npm run build` - build the frontend for production
- `npm run preview` - preview the frontend production build
- `npm run test:frontend` - run frontend smoke checks
- `npm run qa` - run frontend build, backend build, backend route checks, and frontend smoke checks
- `npm run demo:seed` - run backend seed only
- `npm run demo:setup` - generate Prisma client, push schema, and seed demo data

### Server scripts

Run from `server/`:

- `npm run dev` - start the Express API with hot reload
- `npm run build` - compile the backend to `server/dist`
- `npm run start` - run compiled backend output
- `npm run test` - run backend route checks
- `npm run db:generate` - generate Prisma client
- `npm run db:push` - push Prisma schema to MySQL
- `npm run db:migrate` - create a Prisma migration
- `npm run db:seed` - seed demo data
- `npm run db:studio` - open Prisma Studio

## Minimal Quality Gate

This repository includes a lightweight quality gate focused on the real slices.

Backend route checks cover:
- auth login returns access token plus refresh cookie
- RBAC rejects front-office access to admin-only user listing
- restaurant staff can reach live restaurant menu and kitchen routes
- front-office access is rejected from restaurant routes
- public QR menu exposes live restaurant settings and menu data
- booking creation rejects fully reserved room types
- restaurant table orders require `tableNumber` and use configured live tables
- room-service creation rejects invalid booking/room/guest linkage
- restaurant totals ignore client-submitted price tampering
- managers can update restaurant settings, tables, and categories
- kitchen item progression updates the parent order status
- payment patch persists `paymentMethod`, `paymentStatus`, and completion state

Frontend smoke checks cover:
- login page shell is present
- dashboard shell is present
- router uses lazy loading
- restaurant POS, kitchen, back office, and QR menu keep live workflow markers
- production build emits split `Login` and `Dashboard` chunks

Run everything with:

```bash
npm run qa
```

## API Overview

Authentication:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Bookings and front office:
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/status`
- `GET /api/bookings/arrivals/today`
- `GET /api/bookings/checkouts/today`

Restaurant:
- `GET /api/restaurant/public-menu`
- `GET /api/restaurant/settings`
- `PATCH /api/restaurant/settings`
- `GET /api/restaurant/tables`
- `POST /api/restaurant/tables`
- `PATCH /api/restaurant/tables/:id`
- `DELETE /api/restaurant/tables/:id`
- `GET /api/restaurant/categories`
- `POST /api/restaurant/categories`
- `PATCH /api/restaurant/categories/:id`
- `DELETE /api/restaurant/categories/:id`
- `GET /api/restaurant/menu`
- `POST /api/restaurant/menu`
- `PUT /api/restaurant/menu/:id`
- `GET /api/restaurant/orders`
- `GET /api/restaurant/orders/:id`
- `POST /api/restaurant/orders`
- `POST /api/restaurant/orders/:id/items`
- `PATCH /api/restaurant/orders/:id/release`
- `PATCH /api/restaurant/orders/:id/status`
- `PATCH /api/restaurant/orders/:orderId/items/:itemId/status`
- `PATCH /api/restaurant/orders/:id/payment`
- `PATCH /api/restaurant/orders/:id/void-request`
- `PATCH /api/restaurant/orders/:id/void-approve`
- `POST /api/restaurant/orders/:id/refund`
- `GET /api/restaurant/kitchen`

Rooms:
- `GET /api/rooms`
- `GET /api/rooms/types`
- `PATCH /api/rooms/:id/status`

Reports:
- `GET /api/reports/dashboard`
- `GET /api/reports/occupancy`
- `GET /api/reports/revenue`
- `GET /api/reports/booking-sources`

Admin:
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/roles`

## Project Structure

```text
Sawingir-Hills-Hotel-Management-System/
|-- app/
|   |-- components/
|   |-- lib/
|   |   |-- api.ts
|   |   |-- auth-context.tsx
|   |   |-- feature-flags.ts
|   |   `-- runtime-env.ts
|   |-- pages/
|   `-- routes.tsx
|-- scripts/
|   `-- demo-setup.mjs
|-- server/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- src/
|   |   |-- app.ts
|   |   |-- env.ts
|   |   |-- index.ts
|   |   |-- middleware/
|   |   |-- routes/
|   |   `-- utils/
|   `-- test/
|       `-- run-routes.mjs
|-- tests/
|   `-- run-frontend-smoke.mjs
|-- database/
|   `-- schema.sql
`-- README.md
```

## Honest Project Positioning

If you are presenting this project, the strongest accurate description is:

- the core hotel operations slice is productionized
- the restaurant v1 slice is real and testable end-to-end
- security is much stronger than the original prototype
- the app includes a repeatable demo database setup
- some secondary modules remain prototype/development work and are intentionally hidden from the default production navigation

That positioning is more credible than claiming the entire platform is finished.

## License

This project is private and maintained for academic and hotel operations demonstration use.

