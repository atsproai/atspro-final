import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
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
