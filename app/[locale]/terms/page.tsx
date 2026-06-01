import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service | NumZero',
    description: 'Terms and conditions for using NumZero SMS activation services',
  }
}

export default async function TermsPage() {
  const t = await getTranslations('terms')

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-16 max-w-4xl'>
        <header className='mb-12'>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>Terms of Service</h1>
          <p className='text-lg text-muted-foreground'>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        <section className='prose prose-neutral dark:prose-invert max-w-none'>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using NumZero (&quot;the Service&quot;), you accept and agree to be
            bound by the terms and provision of this agreement. If you do not agree to abide by
            these terms, please do not use this Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            NumZero provides virtual phone number services for SMS verification purposes. The
            Service allows users to receive SMS verification codes from various online platforms and
            services.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To access certain features of the Service, you must register for an account. When you
            register:
          </p>
          <ul>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
          </ul>

          <h2>4. Credits and Payments</h2>
          <p>The Service operates on a credit-based system:</p>
          <ul>
            <li>Credits can be purchased through available payment methods</li>
            <li>Credits are non-transferable and cannot be exchanged for cash</li>
            <li>Prices are subject to change with reasonable notice</li>
            <li>All payments are processed securely through our payment partners</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree NOT to use the Service:</p>
          <ul>
            <li>For any illegal purpose or in violation of any laws</li>
            <li>To create accounts on platforms that prohibit such activity</li>
            <li>To harass, abuse, or harm other individuals</li>
            <li>To distribute spam or unsolicited communications</li>
            <li>To impersonate any person or entity</li>
            <li>To interfere with or disrupt the Service</li>
          </ul>

          <h2>6. Service Availability</h2>
          <p>We strive to maintain high service availability but cannot guarantee:</p>
          <ul>
            <li>100% uptime or uninterrupted service</li>
            <li>SMS delivery from all platforms or services</li>
            <li>Availability of phone numbers for all countries</li>
            <li>Specific delivery times for SMS messages</li>
          </ul>

          <h2>7. Refund Policy</h2>
          <p>
            Credits purchased are generally non-refundable. However, refunds may be considered in
            the following cases:
          </p>
          <ul>
            <li>Technical issues on our end that prevent service delivery</li>
            <li>Number failures where no SMS was received and the number was not used</li>
            <li>Duplicate charges due to system errors</li>
          </ul>

          <h2>8. Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We collect and process
            data in accordance with applicable data protection laws including GDPR.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, NumZero shall not be liable for:</p>
          <ul>
            <li>Any indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Any damages arising from unauthorized access to your account</li>
            <li>Service interruptions or data loss</li>
          </ul>

          <h2>10. Account Termination</h2>
          <p>We reserve the right to terminate or suspend your account:</p>
          <ul>
            <li>For violation of these Terms</li>
            <li>For fraudulent or illegal activity</li>
            <li>For abusive behavior toward other users or staff</li>
            <li>At our discretion with reasonable notice</li>
          </ul>

          <h2>11. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective upon
            posting. Continued use of the Service after changes constitutes acceptance of the
            modified Terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any
            disputes shall be resolved in the appropriate courts of jurisdiction.
          </p>

          <h2>13. Contact Information</h2>
          <p>For questions about these Terms, please contact us:</p>
          <ul>
            <li>Email: support@numzero.app</li>
            <li>Through our support chat available on the platform</li>
          </ul>
        </section>

        <footer className='mt-16 pt-8 border-t'>
          <p className='text-sm text-muted-foreground'>
            By using NumZero, you acknowledge that you have read and understood these Terms of
            Service and agree to be bound by them.
          </p>
        </footer>
      </div>
    </div>
  )
}
