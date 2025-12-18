'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  FileText, 
  Briefcase, 
  MessageCircle, 
  Wrench, 
  TrendingUp,
  Menu,
  X,
  Home,
  History as HistoryIcon,
  Target,
  Mail,
  Linkedin
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Dashboard...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push('/');
    return null;
  }

  const sections = [
    {
      id: 'resumes',
      name: 'My Resumes',
      items: [
        { id: 'history', name: 'Resume History', icon: <HistoryIcon size={16} /> }
      ]
    },
    {
      id: 'jobs',
      name: 'Job Search',
      items: [
        { id: 'tracker', name: 'Application Tracker', icon: <Target size={16} /> }
      ]
    },
    {
      id: 'interviews',
      name: 'Interview Prep',
      items: [
        { id: 'questions', name: 'Interview Questions', icon: <MessageCircle size={16} /> }
      ]
    },
    {
      id: 'tools',
      name: 'Career Tools',
      items: [
        { id: 'linkedin', name: 'LinkedIn Optimizer', icon: <Linkedin size={16} /> },
        { id: 'emails', name: 'Email Templates', icon: <Mail size={16} /> }
      ]
    }
  ];

  const renderContent = () => {
    if (activeSection === 'home') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome, {user?.firstName || 'there'}! 👋
          </h2>
          <p className="text-purple-200 mb-8 text-lg max-w-2xl mx-auto">
            Your all-in-one job search toolkit. Select a tool from the sidebar to get started!
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition"
          >
            Start New ATS Scan
          </button>
        </div>
      );
    }

    if (activeSection === 'history') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-3xl font-bold text-white mb-4">Resume History</h2>
          <p className="text-purple-200 mb-6">View your past ATS scans</p>
          <button
            onClick={() => router.push('/history')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
          >
            Go to History Page
          </button>
        </div>
      );
    }

    if (activeSection === 'tracker') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-3xl font-bold text-white mb-4">Application Tracker</h2>
          <p className="text-purple-200 mb-6">Coming in Phase 2!</p>
          <div className="text-white text-sm bg-white/10 p-4 rounded-lg max-w-md mx-auto">
            We'll add the full tracker with stats and reminders next!
          </div>
        </div>
      );
    }

    if (activeSection === 'questions') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">💬</div>
          <h2 className="text-3xl font-bold text-white mb-4">Interview Questions</h2>
          <p className="text-purple-200 mb-6">Practice interview questions</p>
          <button
            onClick={() => router.push('/interview-prep')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
          >
            Go to Interview Prep
          </button>
        </div>
      );
    }

    if (activeSection === 'linkedin') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">💼</div>
          <h2 className="text-3xl font-bold text-white mb-4">LinkedIn Optimizer</h2>
          <p className="text-purple-200 mb-6">Optimize your LinkedIn profile</p>
          <button
            onClick={() => router.push('/linkedin-optimizer')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
          >
            Go to LinkedIn Optimizer
          </button>
        </div>
      );
    }

    if (activeSection === 'emails') {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">✉️</div>
          <h2 className="text-3xl font-bold text-white mb-4">Email Templates</h2>
          <p className="text-purple-200 mb-6">Generate professional emails</p>
          <button
            onClick={() => router.push('/email-templates')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
          >
            Go to Email Templates
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="text-white text-2xl">Select an option from the sidebar</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 flex-col">
        <div className="p-6 border-b border-white/10">
          <button
            onClick={() => setActiveSection('home')}
            className="flex items-center gap-2 text-white hover:text-pink-400 transition"
          >
            <Home size={24} />
            <span className="font-bold text-xl">Dashboard</span>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="mb-6">
              <h3 className="text-purple-300 text-xs uppercase font-semibold mb-2 px-3">
                {section.name}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      activeSection === item.id
                        ? 'bg-pink-500 text-white'
                        : 'text-purple-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-lg p-3 rounded-lg border border-white/20"
      >
        <Menu className="text-white" size={24} />
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="w-64 h-full bg-gradient-to-br from-purple-900 to-indigo-900 border-r border-white/20">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <button
                onClick={() => setActiveSection('home')}
                className="flex items-center gap-2 text-white"
              >
                <Home size={24} />
                <span className="font-bold text-xl">Dashboard</span>
              </button>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="text-white" size={24} />
              </button>
            </div>

            <nav className="p-4 overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id} className="mb-6">
                  <h3 className="text-purple-300 text-xs uppercase font-semibold mb-2 px-3">
                    {section.name}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                          activeSection === item.id
                            ? 'bg-pink-500 text-white'
                            : 'text-purple-200 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
