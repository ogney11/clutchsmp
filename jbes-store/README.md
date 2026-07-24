# ClutchSMP Store

Premium Minecraft store built with Next.js 15, TypeScript, Tailwind CSS, Stripe Checkout, Supabase/PostgreSQL, and Minecraft RCON delivery.

## Features

- Minecraft username required before checkout
- Stripe Checkout API route for card and PLN BLIK payments
- Apple Pay and Google Pay support through Stripe Checkout when available on the buyer's device
- Stripe webhook signature verification
- Supabase/PostgreSQL pending order storage
- Paid order marking after verified webhook
- Minecraft RCON delivery commands
- Delivery states: `pending`, `delivered`, `failed`
- Checkout complete and cancelled screens
- Stored payment methods: `card`, `blik`
- Customer currency selector for `USD`, `EUR`, `PLN`, and `GBP`
- Player-submitted homepage reviews stored in Supabase
- Admin order dashboard at `/admin`
- Manual retry endpoint for failed RCON deliveries
- Server-only secret usage through environment variables

## Products

Products and commands are configured in `src/lib/payment-products.ts`. Product prices are stored as USD base prices, and the store converts them to the selected checkout currency.

Included products:

- Totem: `$1`
- Shulker Box: `$5`
- Common Key
- Epic Key
- Legendary Key
- Coins
- Monthly ranks
- Permanent ranks

Current rank prices:

| Rank | Monthly | Permanent |
| --- | ---: | ---: |
| VIP | `$2.99` | `$9.99` |
| SVIP | `$5.99` | `$19.99` |
| Sponsor | `$9.99` | `$34.99` |
| Elite | `$14.99` | `$49.99` |
| Swagger | `$19.99` | `$69.99` |

Rank product IDs follow this format:

- `rank-swagger-monthly`
- `rank-swagger-permanent`
- `rank-elite-monthly`
- `rank-elite-permanent`
- `rank-sponsor-monthly`
- `rank-sponsor-permanent`
- `rank-svip-monthly`
- `rank-svip-permanent`
- `rank-vip-monthly`
- `rank-vip-permanent`

## Environment

Copy `.env.example` to `.env.local` and fill every secret.

```bash
cp .env.example .env.local
```

Required values:

```env
NEXT_PUBLIC_SITE_URL=https://clutch-smp.vercel.app
# Optional public conversion-rate override:
# NEXT_PUBLIC_STORE_CURRENCY_RATES_JSON={"USD":1,"EUR":0.92,"PLN":4,"GBP":0.78}
MINECRAFT_STATUS_PORT=25682
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RCON_HOST=
RCON_PORT=25575
RCON_PASSWORD=
ADMIN_API_TOKEN=
```

Never expose these to the frontend:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RCON_PASSWORD`
- `ADMIN_API_TOKEN`

`NEXT_PUBLIC_STORE_CURRENCY_RATES_JSON` is optional and not secret. Use it only if you want to override the built-in conversion rates, for example:

```env
NEXT_PUBLIC_STORE_CURRENCY_RATES_JSON={"USD":1,"EUR":0.92,"PLN":4,"GBP":0.78}
```

## Database Setup

Create a Supabase project, open **SQL Editor**, paste the full contents of [supabase/schema.sql](./supabase/schema.sql), and click **Run**.

After it runs, verify the table exists with:

```sql
select 'orders' as table_name, count(*) from public.orders
union all
select 'reviews' as table_name, count(*) from public.reviews;
```

The schema creates `public.orders` and `public.reviews`, indexes, selected currency fields, delivery status fields, external payment IDs, and row-level security that blocks public table access. The app uses the Supabase service role key only from server-side code.

## Player Reviews

The homepage review form posts to:

```text
POST /api/reviews
```

The homepage loads visible reviews from:

```text
GET /api/reviews
```

Reviews are saved in `public.reviews` with Minecraft username, rating, review text, and visibility. The frontend never connects to Supabase directly.

## Stripe Setup

1. Create or open a Stripe account.
2. In Stripe Dashboard, use test mode first.
3. Go to **Developers > API keys** and copy the secret key into `.env.local` as `STRIPE_SECRET_KEY`.
4. Card payments work by default. Apple Pay and Google Pay can appear automatically inside Stripe Checkout when Stripe, the browser, and the buyer's device support them.
5. Enable **BLIK** in **Settings > Payment methods** if your Stripe account supports it. The store only offers BLIK when the buyer selects `PLN`.
6. Create a webhook endpoint in **Developers > Webhooks**:

```text
https://store.yourdomain.com/api/webhooks/stripe
```

7. Subscribe to:

```text
checkout.session.completed
```

8. Copy the webhook signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
9. Set `NEXT_PUBLIC_SITE_URL` to the real public store URL, for example `https://clutch-smp.vercel.app`. Do not use `http://localhost:3000` in Vercel.
10. Restart the app after changing `.env.local`.

The frontend shows `Card / Apple Pay / Google Pay` for every currency. When `PLN` is selected, it also shows a `BLIK` button. Card checkout creates a Stripe Checkout Session with `payment_method_types: ["card"]` and disables Stripe Link for that session. BLIK checkout creates a Stripe Checkout Session with `payment_method_types: ["blik"]`.

Stripe success and cancel redirects are generated from `NEXT_PUBLIC_SITE_URL`. On Vercel, the backend also refuses to use a localhost URL and falls back to Vercel's production/deployment URL when available.

Local testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the `whsec_...` value printed by the Stripe CLI as `STRIPE_WEBHOOK_SECRET` during local testing.

## Minecraft RCON Setup

Enable RCON in your Minecraft server config:

```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

Add matching values:

```env
RCON_HOST=your.server.ip
RCON_PORT=25575
RCON_PASSWORD=your_secure_password
```

Delivery commands use `{username}` replacement. Examples:

```text
give {username} minecraft:totem_of_undying 1
give {username} minecraft:shulker_box 1
crate key give {username} common 1
crate key give {username} epic 1
crate key give {username} legendary 1
lp user {username} parent addtemp vip 30d
lp user {username} parent add vip
```

## Command Overrides

Default commands are in `src/lib/payment-products.ts`.

You can override commands without editing code:

```env
PRODUCT_COMMANDS_JSON={"totem":"give {username} minecraft:totem_of_undying 1","rank-vip-monthly":"lp user {username} parent addtemp vip 30d"}
```

## Admin Dashboard

Open:

```text
/admin
```

Enter the `ADMIN_API_TOKEN` value. The dashboard can:

- View recent orders
- Check payment status
- Check delivery status
- See delivery errors
- Retry paid orders that failed RCON delivery

Protected endpoints:

```text
GET /api/admin/orders
POST /api/admin/orders/:orderId/retry
```

Both require:

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Payment Flow

1. Player selects a product.
2. Player enters Minecraft username.
3. Player chooses a currency.
4. Player chooses Card / Apple Pay / Google Pay checkout, or BLIK when using PLN.
5. Backend creates a pending order in Supabase.
6. Backend creates a Stripe Checkout Session in the selected currency.
7. Player pays on hosted checkout.
8. Stripe redirects to `/checkout/complete` or `/checkout/cancelled`.
9. Stripe sends a signed webhook.
10. Backend verifies signature.
11. Backend marks order paid.
12. Backend sends configured RCON command automatically.
13. Order delivery status becomes `delivered` or `failed`.
14. Admin can retry failed delivery.

The complete screen also verifies the Stripe Checkout Session server-side and can trigger delivery if the webhook is delayed. The webhook is still the primary delivery path.
