import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { ToastProvider } from './components/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ATSpro.ai - Beat the ATS & Land Your Dream Job',
  description: 'AI-powered resume optimization, ATS compatibility checking, and job search tools',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
