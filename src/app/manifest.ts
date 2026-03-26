import type { MetadataRoute } from 'next'
import { getBrandConfig } from '@/config/branding'

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandConfig()

  return {
    name: brand.name,
    short_name: brand.name,
    description:
      'ShipFree is a free open-source Next.js SaaS boilerplate alternative to ShipFast. Simplify and optimize your shipping process with modern web technologies like Supabase, Stripe, LemonSqueezy, Drizzle ORM, and Mailgun.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: brand.theme?.primaryColor,
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/image.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/image.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/image.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['developer tools', 'productivity', 'saas'],
    shortcuts: [
      {
        name: 'Open My Space',
        short_name: 'My Space',
        description: 'Go to your ShipFree space',
        url: '/my-space',
      },
    ],
    lang: 'en-US',
    dir: 'ltr',
  }
}
