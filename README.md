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
- `VITE_API_BASE_URL`: Base URL the frontend uses to contact the API (defaults to `/api`).
- `VITE_STORE_EMAIL`: Address that receives order notifications (`dafechadout@gmail.com` by default).
- `MAIL_CHARSET`: Character set for outgoing mail (defaults to `UTF-8`).
- `MAIL_HOST`: SMTP host for sending email (defaults to `dafechad.com`).
- `MAIL_PORT`: SMTP port for sending email (defaults to `587`).
- `MAIL_USERNAME`: SMTP username (`web` by default).
- `MAIL_PASSWORD`: SMTP password.
- `MAIL_FROM_ADDRESS`: Address used in the `From` header (`info@dafechad.com` by default).
- `MAIL_FROM_NAME`: Display name for the `From` header (`דף אחד - מידע` by default).
- `MAIL_BCC_ADDRESS`: Default BCC address applied to every email (`dafechadout@gmail.com` by default).
- `MAIL_BCC_NAME`: Display name for the default BCC recipient (`דף אחד - עותק` by default).
- `ZCREDIT_BASE_URL`: Base URL for the ZCredit WebCheckout API (for example, `https://pci.zcredit.co.il/zCreditWS/`; the
  server appends `/api/WebCheckout/CreateSession`).
- `ZCREDIT_TERMINAL`: Terminal number supplied by ZCredit.
- `ZCREDIT_PASSWORD`: Terminal password supplied by ZCredit.
- `ZCREDIT_KEY`: WebCheckout key supplied by ZCredit.
- `HFD_BASE_URL`: Base URL for the HFD API (defaults to `https://test.hfd.co.il/RunCom.WebAPI/api/v1`).
- `HFD_TOKEN`: Bearer token for HFD API requests (example token provided in `.env.example`).
- `HFD_CLIENT_NUMBER`: HFD client number (example `12916`).
- `HFD_STAGE_CODE`: HFD shipment stage code (defaults to `5`).
- `HFD_SHIPMENT_TYPE`: HFD shipment type code (defaults to `35`).
- `HFD_CARGO_TYPE`: HFD cargo type (`10` by default).
- `HFD_BASE_RATE_ILS`: Base shipping rate in ILS (defaults to `0`).
- `HFD_RATE_PER_KG_ILS`: Per-kg shipping rate in ILS (defaults to `0`).
- `HFD_ORDERER_NAME`: Name sent to HFD as the orderer (defaults to `Daf Echad`).
- `HFD_TRACKING_BASE_URL`: Base URL for HFD tracking (defaults to `https://test.hfd.co.il/RunCom.Server` or derived from `HFD_BASE_URL`).

## ZCredit checkout

The backend already exposes `POST /api/zcredit/create-checkout`, which assembles the request body expected by the ZCredit WebCheckout API and returns a hosted checkout URL. The call uses these environment variables:

- `ZCREDIT_BASE_URL` – Base URL for the ZCredit WebCheckout API (for example, `https://pci.zcredit.co.il/zCreditWS/`).
- `ZCREDIT_TERMINAL` – Terminal number supplied by ZCredit.
- `ZCREDIT_PASSWORD` – Terminal password supplied by ZCredit.
- `ZCREDIT_KEY` – WebCheckout key supplied by ZCredit (GUID).

From ZCredit you therefore need the terminal number, terminal password, and WebCheckout key. The `create-checkout` handler currently sends the following payload fields:

- `Key`, `TerminalNumber`, `User`, `Password` – Taken from the environment variables above.
- `Local` – Set to `He`.
- `UniqueId` – The order ID sent from the client (falls back to `ORD-<timestamp>`).
- `SuccessUrl`, `CancelUrl`, `CallbackUrl` – Empty strings by default; set them from the client request if you want ZCredit to redirect or callback to your site.
- `PaymentType` – `authorize`.
- `Installments` – Sent with `Type: "regular"` and the min/max quantity matching the requested number of installments (defaults to 1).
- `Customer` – Email and name fields (sent empty in the current client call; populate them if you collect those details).
- `CartItems` – One item that uses the requested amount as the `Amount` (ILS), with `Name`/`Description` derived from the client description or order ID.

The request also supports a `PhoneNumber` on the `Customer` object (populated from `customerPhone`) and the redirect URLs supplied by the client (`successUrl`, `cancelUrl`, `callbackUrl`).

To finish the integration, pass the following from the client when starting checkout:

- `amount` (required) – Total price in ILS.
- `description` – A short label for the order (appears as the cart item name/description).
- `orderId` – A unique order reference; if omitted the server generates one.
- `installments` – Number of installments (defaults to 1).
- `customerEmail` / `customerName` – Optional but recommended for the hosted page.
- `successUrl` / `cancelUrl` / `callbackUrl` – URLs that ZCredit should redirect or post back to after payment.

### Payment return URLs

When you send customers to the hosted WebCheckout page, provide three URLs so both the buyer and your server know what happened:

- **CallbackUrl** – An asynchronous `POST` from ZCredit with the transaction data. This is delivered server-to-server (and retried up to five times), so you will not see it in your browser dev tools. The backend exposes `POST /api/zcredit/callback`, which logs the payload and returns a simple `{ status: "ok" }` response. Point `CallbackUrl` at that endpoint so you can capture the results on your server.
- **SuccessUrl** – Where the buyer is redirected after a successful charge. If you embed the checkout in an iframe, use a page on your site that can break out of the iframe before returning to your app.
- **CancelUrl** – An optional redirect if the buyer cancels the payment. Use it only if you want to offer a cancel path.

## Health check

`GET /api/db-health` pings the database and returns the server time to confirm connectivity to the remote MySQL instance.

## Email API

`POST /api/email/send` accepts a JSON body with `to`, `subject`, and either `text` or `html` fields. All outgoing mail uses the configured SMTP account and automatically includes the default BCC recipient.
