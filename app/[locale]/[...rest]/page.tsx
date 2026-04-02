import { notFound } from 'next/navigation'

/**
 * Catch-all page for unmatched routes
 * Returns 404 for any route that doesn't match existing pages
 */
export default function CatchAllPage() {
  notFound()
}
