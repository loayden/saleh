# AI integration guide

The application now has server-side OpenAI boundaries:

- `POST /api/inspiration/analyze` accepts a validated image, reads verified available inventory, requests structured analysis, and returns only matching live product IDs.
- `POST /api/inspiration/generate` requests an approximate concept image from the selected brief.
- `POST /api/assistant` answers Arabic fabric questions using live verified products and the signed-in customer's own recent orders.

When `OPENAI_API_KEY` is absent, these routes return a clear `501` setup response. They never fall back to fabricated products, prices, stock, or recommendations. Configure the server key, model names, upload retention/storage policy, moderation, rate limits, cost limits, and evaluation set before enabling the provider in production.
