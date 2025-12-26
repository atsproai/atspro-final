import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-white shadow-2xl rounded-2xl w-full',
              headerTitle: 'text-3xl font-bold text-gray-900',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'border-2 hover:bg-gray-50 text-base py-3',
              formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-base py-3',
              formFieldInput: 'border-2 focus:border-purple-600 text-base py-3',
              footerActionLink: 'text-purple-600 hover:text-purple-700 font-semibold',
              identityPreviewEditButton: 'text-purple-600 hover:text-purple-700',
              formFieldLabel: 'text-gray-700 font-semibold',
              dividerLine: 'bg-gray-300',
              dividerText: 'text-gray-500',
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  )
}
