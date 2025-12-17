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
  GitBranch,
  Target,
  BarChart3,
  FileSearch,
  Users,
  Mail,
  Linkedin,
  DollarSign,
  BookOpen,
  Building
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [activeSection, setActiveSection] = useState('resumes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Please sign in to access Dashboard</div>
          <button 
            onClick={() => router.push('/')}
            className="bg-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'resumes',
      name: 'My Resumes',
      icon: FileText,
      items: [
        { id: 'history', name: 'Resume History', icon: HistoryIcon },
        { id: 'versions', name: 'Resume Versions', icon: GitBranch },
        { id: 'abtesting', name: 'A/B Testing', icon: BarChart3 }
      ]
    },
    {
      id: 'jobs',
      name: 'Job Search',
      icon: Briefcase,
      items: [
        { id: 'tracker', name: 'Application Tracker', icon: Target },
        { id: 'analyzer', name: 'Job Description Analyzer', icon: FileSearch }
      ]
    },
    {
      id: 'interviews',
      name: 'Interview Prep',
      icon: MessageCircle,
      items: [
        { id: 'questions', name: 'Interview Questions', icon: MessageCircle },
        { id: 'company-research', name: 'Company Research', icon: Building }
      ]
    },
    {
      id: 'tools',
      name: 'Career Tools',
      icon: Wrench,
      items: [
        { id: 'linkedin', name: 'LinkedIn Optimizer', icon: Linkedin },
        { id: 'emails', name: 'Email Templates', icon: Mail },
        { id: 'networking', name: 'Networking Tracker', icon: Users }
      ]
    },
    {
      id: 'growth',
      name: 'Career Growth',
      icon: TrendingUp,
      items: [
        { id: 'skills-gap', name: 'Skills Gap Analyzer', icon: BookOpen },
        { id: 'salary', name: 'Salary Negotiation', icon: DollarSign }
      ]
    }
  ];

  const renderContent = () => {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Welcome to Your Dashboard!</h2>
        <p className="text-purple-200 mb-8">Select a tool from the menu to get started</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/20 transition"
            >
              <section.icon className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold">{section.name}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/10 backdrop-blur-lg border-b border-white/20 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white/5 backdrop-blur-lg border-r border-white/20 min-h-screen p-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white mb-8 hover:text-purple-200"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </button>

          <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

          <nav className="space-y-6">
            {sections.map(section => (
              <div key={section.id}>
                <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                  <section.icon size={18} />
                  <span>{section.name}</span>
                </div>
                <div className="ml-6 space-y-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2 w-full p-2 rounded text-sm transition ${
                        activeSection === item.id
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-200 hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={16} />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Sidebar (Drawer) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="bg-purple-900 w-64 h-full overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-white mb-8 hover:text-purple-200"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

              <nav className="space-y-6">
                {sections.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                      <section.icon size={18} />
                      <span>{section.name}</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {section.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full p-2 rounded text-sm transition ${
                            activeSection === item.id
                              ? 'bg-purple-600 text-white'
                              : 'text-purple-200 hover:bg-white/5'
                          }`}
                        >
                          <item.icon size={16} />
                          <span>{item.name}</span>
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
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
