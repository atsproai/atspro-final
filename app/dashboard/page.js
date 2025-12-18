'use client';
import React, { useState, useEffect } from 'react';
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
  Linkedin,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Job tracker state
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company_name: '', job_title: '', job_url: '', salary_range: '', notes: ''
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if ((activeSection === 'tracker' || activeSection === 'home') && mounted) {
      fetchApplications();
    }
  }, [activeSection, mounted]);

  if (!isLoaded || !mounted) {
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

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await fetch('/api/job-applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
    setApplicationsLoading(false);
  };

  const addApplication = async () => {
    if (!newApplication.company_name || !newApplication.job_title) {
      alert('Company name and job title are required!');
      return;
    }
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApplication)
      });
      if (res.ok) {
        setNewApplication({ company_name: '', job_title: '', job_url: '', salary_range: '', notes: '' });
        setShowAddApplication(false);
        fetchApplications();
        alert('Application added!');
      } else {
        alert('Failed to add application!');
      }
    } catch (err) {
      alert('Error adding application!');
    }
  };

  const updateApplicationStatus = async (id, newStatus) => {
    try {
      const res = await fetch('/api/job-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        fetchApplications();
        alert('Status updated!');
      } else {
        alert('Failed to update status!');
      }
    } catch (err) {
      alert('Error updating status!');
    }
  };

  const deleteApplication = async (id) => {
    if (!confirm('Delete this application?')) return;
    try {
      const res = await fetch(`/api/job-applications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchApplications();
        alert('Application deleted!');
      } else {
        alert('Failed to delete!');
      }
    } catch (err) {
      alert('Error deleting application!');
    }
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'applied': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'phone-screen': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      case 'interview': return 'bg-purple-500/20 text-purple-300 border-purple-500';
      case 'offer': return 'bg-green-500/20 text-green-300 border-green-500';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  const getFollowUpApplications = () => {
    const sevenDaysAgo = 7 * 24 * 60 * 60 * 1000;
    return applications.filter(app => {
      const daysSince = Date.now() - new Date(app.applied_date).getTime();
      return app.status === 'applied' && daysSince > sevenDaysAgo;
    });
  };

  const getApplicationStats = () => {
    return {
      total: applications.length,
      applied: applications.filter(a => a.status === 'applied').length,
      phoneScreen: applications.filter(a => a.status === 'phone-screen').length,
      interview: applications.filter(a => a.status === 'interview').length,
      offer: applications.filter(a => a.status === 'offer').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      responseRate: applications.length > 0 
        ? Math.round(((applications.length - applications.filter(a => a.status === 'applied').length) / applications.length) * 100)
        : 0
    };
  };

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
      const stats = getApplicationStats();
      const followUpApps = getFollowUpApplications();

      return (
        <div className="space-y-6">
          {followUpApps.length > 0 && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Bell className="text-red-300 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    ⚠️ {followUpApps.length} Application{followUpApps.length > 1 ? 's' : ''} Need Follow-Up!
                  </h3>
                  <p className="text-red-100 mb-4">
                    These applications are over 7 days old. Consider sending a follow-up email!
                  </p>
                  <div className="space-y-2">
                    {followUpApps.slice(0, 3).map(app => (
                      <div key={app.id} className="bg-white/10 rounded-lg p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                          <div className="font-semibold text-white">{app.company_name}</div>
                          <div className="text-sm text-red-200">{app.job_title} • {getDaysAgo(app.applied_date)} days ago</div>
                        </div>
                        <button
                          onClick={() => router.push('/email-templates')}
                          className="bg-white text-purple-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-100 whitespace-nowrap"
                        >
                          Send Follow-Up
                        </button>
                      </div>
                    ))}
                  </div>
                  {followUpApps.length > 3 && (
                    <button
                      onClick={() => setActiveSection('tracker')}
                      className="text-red-200 text-sm mt-3 underline hover:text-white"
                    >
                      View all {followUpApps.length} applications →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {applications.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-pink-500" size={32} />
                <h2 className="text-3xl md:text-4xl font-bold text-white">Your Progress</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                  <div className="text-purple-200 text-sm">Total</div>
                </div>
                <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500">
                  <div className="text-3xl font-bold text-blue-300 mb-1">{stats.applied}</div>
                  <div className="text-blue-200 text-sm">Applied</div>
                </div>
                <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500">
                  <div className="text-3xl font-bold text-yellow-300 mb-1">{stats.phoneScreen}</div>
                  <div className="text-yellow-200 text-sm">Phone</div>
                </div>
                <div className="bg-purple-500/20 backdrop-blur-lg rounded-xl p-4 border border-purple-500">
                  <div className="text-3xl font-bold text-purple-300 mb-1">{stats.interview}</div>
                  <div className="text-purple-200 text-sm">Interview</div>
                </div>
                <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500">
                  <div className="text-3xl font-bold text-green-300 mb-1">{stats.offer}</div>
                  <div className="text-green-200 text-sm">Offers</div>
                </div>
                <div className="bg-pink-500/20 backdrop-blur-lg rounded-xl p-4 border border-pink-500">
                  <div className="text-3xl font-bold text-pink-300 mb-1">{stats.responseRate}%</div>
                  <div className="text-pink-200 text-sm">Response</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500 rounded-xl p-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Keep Going! 🚀</h3>
                <p className="text-purple-200">
                  You're actively applying to jobs. Your dream role is closer than you think!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎯</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Welcome, {user?.firstName || 'there'}! 👋</h2>
              <p className="text-purple-200 mb-8 text-lg max-w-2xl mx-auto">
                Track your job applications, optimize your resume, prepare for interviews, and land your dream job!
              </p>
              <button
                onClick={() => setActiveSection('tracker')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition mb-4"
              >
                Start Tracking Applications
              </button>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/')}
                  className="text-purple-200 underline hover:text-white"
                >
                  Or analyze your resume with ATS scan →
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'tracker') {
      const statusOptions = [
        { value: 'applied', label: 'Applied' },
        { value: 'phone-screen', label: 'Phone Screen' },
        { value: 'interview', label: 'Interview' },
        { value: 'offer', label: 'Offer' },
        { value: 'rejected', label: 'Rejected' }
      ];

      return (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Target className="text-pink-500" size={32} />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Job Application Tracker</h2>
            </div>
            <button
              onClick={() => setShowAddApplication(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700"
            >
              <Plus size={20} /> Add Application
            </button>
          </div>

          {showAddApplication && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">New Application</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Company Name*</label>
                  <input
                    type="text"
                    value={newApplication.company_name}
                    onChange={(e) => setNewApplication({...newApplication, company_name: e.target.value})}
                    placeholder="e.g., Google"
                    className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Job Title*</label>
                  <input
                    type="text"
                    value={newApplication.job_title}
                    onChange={(e) => setNewApplication({...newApplication, job_title: e.target.value})}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Job URL</label>
                  <input
                    type="url"
                    value={newApplication.job_url}
                    onChange={(e) => setNewApplication({...newApplication, job_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Salary Range</label>
                  <input
                    type="text"
                    value={newApplication.salary_range}
                    onChange={(e) => setNewApplication({...newApplication, salary_range: e.target.value})}
                    placeholder="e.g., $120k - $150k"
                    className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Notes</label>
                <textarea
                  value={newApplication.notes}
                  onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addApplication}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Save Application
                </button>
                <button
                  onClick={() => setShowAddApplication(false)}
                  className="bg-white/10 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {applicationsLoading ? (
            <div className="text-center py-12">
              <div className="text-white text-xl">Loading applications...</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/20">
              <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Applications Yet</h3>
              <p className="text-purple-200 mb-6">Start tracking your job applications to stay organized!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{app.company_name}</h3>
                      <p className="text-purple-200 text-sm">{app.job_title}</p>
                    </div>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block border ${getStatusColor(app.status)}`}>
                    {app.status.replace('-', ' ').toUpperCase()}
                  </div>

                  <div className="flex items-center gap-2 text-purple-300 text-sm mb-4">
                    <Clock size={14} />
                    <span>{getDaysAgo(app.applied_date)} days ago</span>
                  </div>

                  {app.salary_range && (
                    <div className="text-green-300 text-sm mb-4">
                      💰 {app.salary_range}
                    </div>
                  )}

                  {app.notes && (
                    <p className="text-purple-200 text-sm mb-4 line-clamp-2">{app.notes}</p>
                  )}

                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 text-sm"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-purple-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-300 px-4 py-2 rounded-lg text-sm hover:bg-red-600/30 border border-red-600/50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
