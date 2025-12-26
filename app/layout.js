import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ATSpro.ai - Beat the ATS & Land Your Dream Job',
  description: 'AI-powered resume optimization, ATS compatibility checking, and job search tools',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
        },
        elements: {
          formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 text-sm normal-case',
          card: 'bg-white shadow-xl',
          headerTitle: 'text-2xl font-bold',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-2 hover:bg-gray-50',
          formFieldInput: 'border-2 focus:border-purple-600',
          footerActionLink: 'text-purple-600 hover:text-purple-700',
          // Mobile-specific fixes
          modalContent: 'max-h-[90vh] overflow-y-auto',
          modalCloseButton: 'top-4 right-4 z-50',
        },
        variables: {
          borderRadius: '0.5rem',
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                window.$crisp=[];
                window.CRISP_WEBSITE_ID="8d48204d-8abd-4a17-9bd7-9067c93f6390";
                (function(){
                  d=document;
                  s=d.createElement("script");
                  s.src="https://client.crisp.chat/l.js";
                  s.async=1;
                  d.getElementsByTagName("head")[0].appendChild(s);
                })();
              `
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
