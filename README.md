This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration (`.env.local` / `.env`)

See `.env.example` for the full list. Beyond the Supabase URL and publishable key (SPEC 10), SPEC 13 requires:

| Variable                | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `RESEND_API_KEY`        | Resend SDK, called only from Server Actions (invitation emails).     |
| `RESEND_FROM_EMAIL`     | Sender for invitations. `onboarding@resend.dev` until a domain is verified. |
| `NEXT_PUBLIC_SITE_URL`  | Base URL used in activation links inside emails.                     |

### Supabase Auth dependency: "Confirm email" must be OFF

The invitation-based signup (SPEC 13) creates the parent account with `signUp`
and expects a session back immediately. In the project dashboard
(Authentication → Providers → Email → Confirmation) the **Confirm email** toggle
must be disabled, otherwise activation cannot consume the invitation code and
the flow asks the user to confirm an email that is never needed for this
product (the staff already validated the invitee).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
