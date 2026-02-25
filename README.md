# Salt Cat Charters & Dream Log – Payment Backend

Node.js backend for **Salt Cat Charters** and **Dream Log App** payment processing, deployed on Vercel.

Supports:
- **Stripe** – credit/debit cards, Apple Pay
- **Coinbase Commerce** – Bitcoin (BTC) and Ethereum (ETH)
- **Salt Cat Charters** – one-time date-based booking payments
- **Dream Log App** – one-time and monthly subscription payments

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `COINBASE_COMMERCE_API_KEY` | Coinbase Commerce API key |
| `COINBASE_COMMERCE_WEBHOOK_SECRET` | Coinbase Commerce webhook shared secret |
| `DREAM_LOG_MONTHLY_PRICE_ID` | Stripe Price ID for Dream Log monthly subscription |
| `DREAM_LOG_ONETIME_PRICE_ID` | Stripe Price ID for Dream Log one-time purchase |

### 3. Apple Pay / Payment Method Domains

1. Go to [Stripe Payment Method Domains](https://dashboard.stripe.com/settings/payment_method_domains)
2. Add `saltcatcharters.com` and your Dream Log domain
3. Download the `apple-developer-merchantid-domain-association` file
4. Replace `public/.well-known/apple-developer-merchantid-domain-association` with the downloaded file

---

## API Endpoints

### `POST /create-charge`

Creates a payment charge via Stripe or Coinbase Commerce.

**Request body:**

```json
{
  "app": "saltcat",
  "paymentMethod": "stripe",
  "amount": 25000,
  "currency": "usd",
  "description": "Half Day Charter on 2024-07-15",
  "customerEmail": "customer@example.com",
  "bookingDate": "2024-07-15",
  "planType": "onetime"
}
```

| Field | Values |
|---|---|
| `app` | `"saltcat"` or `"dreamlog"` |
| `paymentMethod` | `"stripe"` or `"coinbase"` |
| `amount` | Amount in cents (e.g. `25000` = $250) |
| `planType` | `"monthly"` or `"onetime"` (Dream Log only) |

**Stripe response:**
```json
{ "type": "payment_intent", "clientSecret": "pi_..." }
```

**Coinbase response:**
```json
{ "type": "coinbase_charge", "chargeId": "...", "hostedUrl": "https://commerce.coinbase.com/charges/..." }
```

### `POST /webhook`

Receives payment status callbacks from Stripe and Coinbase Commerce.

- **Stripe**: Set your webhook URL in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks) to `https://your-vercel-domain.vercel.app/webhook`
- **Coinbase**: Set your webhook URL in the [Coinbase Commerce Dashboard](https://commerce.coinbase.com/settings) to the same URL

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variables in the [Vercel Dashboard](https://vercel.com) under **Settings > Environment Variables**.

---

## Local Development

```bash
npx vercel dev
```

To test webhooks locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/webhook
```
