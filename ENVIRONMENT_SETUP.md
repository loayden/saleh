# Environment setup

The app can boot with the public Supabase URL/key and shows honest live empty states when no verified catalog data exists. Server-only integrations remain disabled until their secrets are configured.

```bash
npm install
npm run dev
```

Use `.env.example` as the full template. Important server-only values include:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_ASSISTANT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-2
PAYMOB_SECRET_KEY=
PAYMOB_PUBLIC_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_BASE_URL=https://accept.paymob.com
PAYMOB_HMAC_SECRET=
DELIVERY_PROVIDER_BASE_URL=
DELIVERY_PROVIDER_TOKEN=
OBSERVABILITY_INGEST_URL=
OBSERVABILITY_INGEST_TOKEN=
APP_VERSION=0.1.0
```

Never expose database, service-role, payment, delivery, observability, or OpenAI secrets through `NEXT_PUBLIC_*` variables. Apply migrations with `supabase db push` and verify local/remote alignment with `supabase migration list`. Use [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) for health monitoring, backup/restore drills, and staging E2E.
