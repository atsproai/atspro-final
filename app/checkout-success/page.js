'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutSuccess() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const updateSubscription = async () => {
      if (!isSignedIn || !user) {
        setStatus('error');
        return;
      }

      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        // Call API to verify session and update database
        const response = await fetch('/api/verify-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: user.id
          })
        });

        if (response.ok) {
          setStatus('success');
          // Redirect to analyzer after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error updating subscription:', error);
        setStatus('error');
      }
    };

    if (isSignedIn && user) {
      updateSubscription();
    }
  }, [isSignedIn, user, searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 max-w-md w-full text-center border border-white/20">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-white mb-3">Processing...</h2>
            <p className="text-purple-200">Setting up your unlimited access</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome to ATSpro!</h2>
            <p className="text-purple-200 mb-4">Your trial has started! You now have unlimited access to all features.</p>
            <p className="text-sm text-purple-300">Redirecting you to the analyzer...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-purple-200 mb-6">Please contact support@ats-pro.io if you were charged but don't have access.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-purple-100 transition"
            >
              Go to Homepage
            </button>
          </>
        )}
      </div>
    </div>
  );
}
