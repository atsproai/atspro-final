'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push('/');
    return null;
  }

  const features = [
    { name: 'Resume History', path: '/history', icon: '📄', desc: 'View past ATS scans' },
    { name: 'Email Templates', path: '/email-templates', icon: '✉️', desc: 'Generate professional emails' },
    { name: 'LinkedIn Optimizer', path: '/linkedin-optimizer', icon: '💼', desc: 'Optimize your LinkedIn profile' },
    { name: 'Interview Prep', path: '/interview-prep', icon: '💬', desc: 'Practice interview questions' },
    { name: 'Resume Analyzer', path: '/', icon: '🎯', desc: 'Check ATS compatibility' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-purple-200 text-xl">
            Your all-in-one job search toolkit
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <button
              key={feature.path}
              onClick={() => router.push(feature.path)}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:border-pink-500 transition-all hover:scale-105 text-left"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{feature.name}</h3>
              <p className="text-purple-200">{feature.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition"
          >
            Start New ATS Scan
          </button>
        </div>
      </div>
    </div>
  );
}
