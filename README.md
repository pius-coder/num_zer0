<div align="center">
  <h1 align="center">📱 Num_zer0 - Prepaid SMS Activation Platform</h1>
  <p align="center">
    <strong>A robust, scalable platform for purchasing virtual numbers and receiving SMS activations globally.</strong>
  </p>
</div>

<br />

Welcome to **num_zero**! Built on the robust foundation of the [ShipFree V2 Boilerplate](https://shipfree.revoks.dev), this project is a fully-featured VoIP/SMS Activation Platform. It allows users to purchase credits and use them to acquire temporary virtual phone numbers to receive SMS verification codes (OTPs) across various global services.

---

## ✨ Core Platform Features

- 💬 **SMS Activations:** Acquire temporary virtual numbers to receive SMS messages from platforms worldwide. Seamlessly integrates with multiple downstream SMS providers (e.g., Tiger SMS).
- 💰 **Robust Wallet Economics:** A sophisticated credit-based wallet system supporting distinct balances for Base, Bonus, and Promotional credits, alongside precise credit holds during active SMS assignments.
- 🌍 **Global Payment Gateways:** Purchase credit packages using international options (Stripe, Polar, Crypto) as well as localize African mobile money solutions (MTN MoMo, Orange Money) via Dodo, Creem, and Autumn Billing.
- 🛡️ **Advanced Fraud Detection:** Built-in automated fraud rules, signal tracking, rate-limiting, and ban mechanisms to protect platform integrity.
- 👥 **Referral & Promo Systems:** Integrated virality tools allowing users to earn credits by inviting others, and applying strategic promotional codes.
- 🛠️ **Comprehensive Admin Dashboard:** Powerful internal tools for user management, support ticketing, credit adjustment approvals, real-time log tailing, and health monitoring.
- 🌐 **Internationalization (i18n):** Native support for English (`en`), French (`fr`), and Spanish (`es`).

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Database:** PostgreSQL managed intricately via [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Better-Auth](https://better-auth.com/) (Email, OAuth, and synthetic Phone-First mapping)
- **Styling:** TailwindCSS 4, augmented with Shadcn UI and BaseUI components
- **Mailing:** Multichannel email routing via Resend, Postmark, Plunk, and Nodemailer
- **Runtime:** [Bun](https://bun.sh/) for lightning-fast package management and execution

---

## 🚀 Quick Start

To get the platform running locally for development:

```bash
# 1. Install dependencies
bun install

# 2. Configure Environment Variables
# Refer to the platform configuration keys in your provider dashboards
cp .env.example .env

# 3. Provision the Database
bun run generate-migration
bun run migrate:local

# 4. Seed the Database
# Crucial for initializing default credit packages, services, and base platform configs
bun run seed:economics

# 5. Start the Development Server
bun run dev
```

---

## 📂 Project Structure

- `src/app/`: Next.js App Router containing route groups `(admin)`, `(app)`, and `(auth)`.
- `src/database/schema.ts`: The absolute core of the application datastore. Contains the robust Economics system (`credit_wallet`, `sms_activation`, `fraud_rule`, etc.).
- `src/i18n/`: Auto-locale routing and navigation wrappers powered by `next-intl`.
- `src/components/`: Reusable UI components and platform-specific feature blocks (like Support Floating Buttons, Admin Shells).
- `src/lib/`: Core utilities, downstream provider implementations, and API proxies.

---

## 🌐 Localization (i18n) Guide

The platform heavily utilizes seamless localized navigation. The `src/i18n/navigation.ts` file wraps standard Next.js routing:

```tsx
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function ExampleComponent() {
  const t = useTranslations('Dashboard')

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* Route is automatically prefixed (e.g. /fr/dashboard) */}
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  )
}
```

To add new languages (e.g., German):
1. Append `de` to the `locales` array in `src/i18n/routing.ts`.
2. Create `messages/de.json`.
3. Update `localeNames` in the language switcher components.

---

## 🤝 Contributing

We welcome contributions to core features, provider integrations, and payment gateways.
Ensure you've read standard contribution flows, and always format/lint with Biome:
```bash
bun run lint
bun run format
```

---
<div align="center">
  Built with ❤️ by the team at <a href="https://revoks.dev">Revoks</a>
</div>