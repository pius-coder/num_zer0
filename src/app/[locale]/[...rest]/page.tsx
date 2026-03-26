import { notFound } from 'next/navigation'

/**
 * Localized catch-all page. Triggers the localized not-found component.
 */
export default function CatchAllPage() {
    notFound()
}
