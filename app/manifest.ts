import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NumZero',
    short_name: 'NumZero',
    description:
      'Virtual numbers for SMS OTP verification with local payments, transparent credit pricing, and anti-fraud controls.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#080808',
    theme_color: '#adfa1b',
    orientation: 'portrait-primary',
    icons: [
      { src: '/image.png', sizes: '192x192', type: 'image/png' },
      { src: '/image.png', sizes: '512x512', type: 'image/png' },
      { src: '/image.png', sizes: '180x180', type: 'image/png' },
    ],
    categories: ['developer tools', 'productivity'],
    shortcuts: [
      {
        name: 'My Space',
        short_name: 'My Space',
        description: 'Go to your dashboard',
        url: '/my-space',
      },
    ],
    lang: 'en-US',
    dir: 'ltr',
  }
}
