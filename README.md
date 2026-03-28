<div align="center">
  <h1 align="center">⚡ ShipFree V2 - Revamping</h1>
  <p align="center">
    <strong>The ultimate open-source Next.js boilerplate alternative to ShipFast.</strong>
  </p>
  <p align="center">
    Designed to simplify and accelerate your web app development.
  </p>
</div>

<br />

Hi there! 👋

**ShipFree** is a fully-featured, free, and open-source starter kit designed to help developers launch their next big idea in days, not months. It brings together the most popular and modern tools in the web development ecosystem so you can focus on building your product instead of configuring infrastructure.

---

## ✨ Features and Integrations

ShipFree comes batteries-included with everything you need for a production-ready application:

- 🚀 **Framework:** [Next.js](https://nextjs.org/) (App Router ready)
- 🗄️ **Database:** [PostgreSQL](https://www.postgresql.org/) managed with [Drizzle ORM](https://orm.drizzle.team/)
- 🎨 **Styling & UI:** [TailwindCSS 4](https://tailwindcss.com/) alongside high-quality components from BaseUI and Shadcn UI
- 🔒 **Authentication:** Comprehensive auth workflows powered by [Better-Auth](https://better-auth.com/)
- 💰 **Billing & Payments:** Integrations with Stripe, Polar, Autumn Billing, Dodo Payments, Commet, and Creem built-in
- 📧 **Emails:** Native support for Resend, Postmark, Plunk, and Nodemailer pipelines
- 🌍 **Internationalization (i18n):** Uses [next-intl](https://next-intl-docs.vercel.app/) supporting English (`en`), French (`fr`), and Spanish (`es`) out of the box
- ⚡ **Runtime & Packages:** Blazing fast development using [Bun](https://bun.sh/)
- 🔍 **SEO Optimization:** Pre-configured tools for dynamic metadata and search engine indexing

---

## ⚡ Quick Start

Get your project up and running locally:

```bash
# 1. Install dependencies using Bun
bun install

# 2. Set up your environment variables
cp .env.example .env

# 3. Generate DB migrations & push schema
bun run generate-migration
bun run migrate:local

# 4. Start the development server
bun run dev
```

---

## 📚 Documentation

For complete, in-depth documentation covering deployment, configuration, and advanced features, please visit our official docs:  
👉 **[ShipFree Official Documentation](https://shipfree.revoks.dev/docs)**

---

## 🌍 Internationalization (i18n) Navigation

ShipFree automatically handles locale routing. The application uses an `as-needed` prefix strategy—meaning the default locale (`en`) doesn't show in the URL, while others do (e.g., `/fr/about`, `/es/about`).

### Navigation Best Practices

We provide specialized hooks and components in `i18n/navigation.ts` that automatically wrap paths with the current locale:

```tsx
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

export function LanguageAwareComponent() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('MyPage')

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* Automatically links to /fr/dashboard if locale is 'fr' */}
      <Link href="/dashboard">Dashboard</Link>
      
      {/* Switch the user's language manually */}
      <button onClick={() => router.replace('/dashboard', { locale: 'es' })}>
        Switch to Spanish
      </button>
    </div>
  )
}
```

### Adding New Languages

1. Add your new locale (e.g., `de` for German) to the `locales` array inside `i18n/routing.ts`.
2. Create a translation JSON file in the `messages/` directory (e.g., `messages/de.json`).
3. Update the `localeNames` object in `components/language-switcher.tsx` to include your new language label.

---

## 🛑 Removing the Premium Purchase Feature

ShipFree includes an isolated premium purchase feature (used originally for selling the template itself). If you are building a SaaS, you'll want to use the primary billing providers (like Stripe or Polar) instead of this isolated flow.

To remove it completely:

1. **Delete Folders:**
   - `app/api/premium-purchase/`
   - `app/api/webhooks/premium-purchase/`
   - `app/[locale]/(site)/premium-purchase/`
2. **Delete Files:**
   - `lib/premium-purchase.ts`, `lib/premium-purchase/hooks.ts`
   - `app/[locale]/(site)/pricing/premium-button.tsx`
3. **Update Layout:** Remove `<PremiumButton />` from `app/[locale]/(site)/pricing.tsx`
4. **Clean up Environments:** Strip all `PREMIUM_PURCHASE_*` keys from your `.env` and `config/env.ts` configurations.

*Note: Doing this will not break your application's actual customer billing features.*

---

## 🤝 Contributing & Community

We believe in open source! For those interested in improving ShipFree, please take a moment to review our guidelines:

- **[Contributing Guide](CONTRIBUTING.md)**: Learn how to set up the project and submit Pull Requests.
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Our community standard for interaction.

---

<div align="center">
  Cooked for you with ❤️ by <a href="https://revoks.dev">Revoks</a>
</div>