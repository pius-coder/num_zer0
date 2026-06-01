import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Wallet — Bitcoin Wallet",
  description: "Reimagine How You Interact With Bitcoin",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
