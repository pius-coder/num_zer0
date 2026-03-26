import { redirect } from 'next/navigation'

/**
 * Root page. Redirects to the default locale.
 */
export default function Home() {
    redirect('/fr')
    return null
}
