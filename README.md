# MPP Demo

A demonstration application for the **Machine Payments Protocol (MPP)** on the Stellar network. This app shows how APIs can charge for access using HTTP 402 Payment Required responses and Stellar smart contracts, with payments settled in `USDC` on Stellar testnet.

## What is MPP?

MPP (Machine Payments Protocol) enables APIs to require payment before serving a response. When a client requests a paid resource, the server responds with an HTTP 402 status and a payment challenge. The client signs a Stellar transaction to authorize payment, resubmits the request, and the server settles the payment on-chain before returning the data.

This demo implements both `pull` (server-initiated) and `push` (client-initiated) payment modes.

## What the app offers

The demo has four sections, accessible from the home page:

- **AI Agent** -- Chat with a Claude-powered AI agent that has access to both free and paid tools. When you ask for something that requires a paid resource, the agent autonomously handles the Stellar payment on your behalf.
- **Free API** -- Fetch resources from open endpoints (quotes, recipes, posts, random numbers) with no payment required. This establishes a baseline to compare against the paid flow.
- **Paid API** -- Request resources from MPP-protected endpoints and watch the full payment flow step-by-step: initial request, 402 challenge, transaction signing, on-chain settlement, and data delivery. Each request costs 0.025 `USDC`. Toggle between pull and push payment modes to see how they differ.
- **Account Setup** -- Generate a Stellar testnet keypair, fund it with Friendbot, and establish a `USDC` trustline in a guided three-step process. A path payment gives you a small amount of `USDC` to start with.

## Getting started

### Prerequisites

- Node.js (v20+)
- [pnpm](https://pnpm.io/)
- A few Stellar testnet accounts (see environment variables below)

### Installation

```sh
pnpm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```sh
cp .env.example .env
```

| Variable                 | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `STELLAR_RECIPIENT`      | Public key of the account that receives payments. Must have a `USDC` trustline. |
| `FEE_PAYER_SECRET`       | Secret key of the account that pays XLM network fees (for sponsored/pull mode). |
| `ENVELOPE_SIGNER_SECRET` | Secret key of the account used as the transaction envelope source.              |
| `MPP_SECRET_KEY`         | Secret key used by the MPP server middleware for signing challenges.            |
| `ANTHROPIC_API_KEY`      | Claude API key, required for the AI agent demo.                                 |

All Stellar accounts should be on **testnet**. You can create and fund them using [Stellar Laboratory](https://laboratory.stellar.org/) or Friendbot.

### Development

```sh
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Building

```sh
pnpm build
```

The project uses the Vercel adapter by default. To deploy elsewhere, swap `@sveltejs/adapter-vercel` for the appropriate [SvelteKit adapter](https://svelte.dev/docs/kit/adapters).

## Project structure

```text
src/
  routes/
    +page.svelte              Home page
    free/+page.svelte         Free API demo
    mpp/+page.svelte          Paid API demo
    chat/+page.svelte         AI agent chat interface
    account/+page.svelte      Account setup wizard
    api/
      free/                   Open endpoints (quote, recipe, post, random)
      paid/[mode=pushpull]/   MPP-protected endpoints (quotes, recipes, posts)
      chat/+server.ts         Claude streaming endpoint
      faucet/+server.ts       Account funding (Friendbot + `USDC` trustline)
      transaction/+server.ts  Submit signed Stellar transactions
  lib/
    state/                    Client-side reactive state (Svelte 5 runes)
    components/ui/            Shared UI components
    types/                    TypeScript interfaces
    utils/                    Stellar transaction helpers
  hooks.server.ts             Server middleware that intercepts paid routes and runs MPP
  params/pushpull.ts          Route parameter matcher for pull/push mode
```

## How MPP works in this codebase

1. **Server middleware** (`hooks.server.ts`) intercepts all requests to `/api/paid/*`.
2. On the first request, the MPP server returns an HTTP `402 Payment Required` response containing a Stellar transaction that the client must sign.
3. The client signs the required authorization entries (`pull` mode, when fees are sponsored) or transaction (`push` mode, or when fees are not sponsored) and resubmits the request with the signed transaction in a payment header.
4. The server verifies the signature, settles the payment on-chain, and returns the requested data along with a payment receipt header.

The paid endpoints proxy data from [dummyjson.com](https://dummyjson.com) -- the point of the demo is the payment flow, not the data itself.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) with Svelte 5
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk) and [`@stellar/mpp`](https://github.com/AhaLabs/rs-sep-81)
- [mppx](https://github.com/wevm/mppx) for MPP client/server utilities
- [Claude API](https://docs.anthropic.com/en/docs) via `@anthropic-ai/sdk` for the agent demo

## License

This project is a demonstration and is not intended for production use with real funds.
