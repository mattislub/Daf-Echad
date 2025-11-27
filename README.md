# Daf-Echad

This project is a Vite + React frontend. A lightweight Node/Express API was added to connect the app to a remote MySQL instance.

## Local setup

1. Copy `.env.example` to `.env` and fill in the MySQL credentials supplied for the remote host.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the MySQL-backed API server:
   ```bash
   npm run server
   ```
   The health endpoint will be available at `http://localhost:5174/api/db-health`.
4. Start the frontend as usual:
   ```bash
   npm run dev
   ```

## Environment variables

- `PORT`: Port for the Express server (defaults to `5174`).
- `MYSQL_HOST`: MySQL host (defaults to `95.217.40.204`).
- `MYSQL_PORT`: MySQL port (defaults to `50282`).
- `MYSQL_USER`: MySQL username.
- `MYSQL_PASSWORD`: MySQL password.
- `MYSQL_DATABASE`: Name of the database to use.
- `MYSQL_SSL`: Set to `true` to enable TLS (disables certificate verification for convenience).
- `VITE_API_BASE_URL`: Base URL the frontend uses to contact the API (defaults to `http://localhost:5174/api`).

## Health check

`GET /api/db-health` pings the database and returns the server time to confirm connectivity to the remote MySQL instance.
