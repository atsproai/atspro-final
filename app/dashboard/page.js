'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { jsPDF } from 'jspdf';

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
  Building,
  Copy,
  Download,
  Calendar,
  Sparkles,
  Lightbulb,
  CheckCircle,
  Send,
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

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryScan, setSelectedHistoryScan] = useState(null);

  const [emailType, setEmailType] = useState('follow-up');
  const [emailJobTitle, setEmailJobTitle] = useState('');
  const [emailCompany, setEmailCompany] = useState('');
  const [emailContext, setEmailContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [linkedinFile, setLinkedinFile] = useState(null);
  const [linkedinTargetRole, setLinkedinTargetRole] = useState('');
  const [linkedinResult, setLinkedinResult] = useState(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const [interviewFile, setInterviewFile] = useState(null);
  const [interviewJob, setInterviewJob] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company_name: '',
    job_title: '',
    job_url: '',
    salary_range: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeSection === 'history' && mounted) {
      fetchHistory();
    }
    if (activeSection === 'tracker' && mounted) {
      fetchApplications();
    }
    if (activeSection === 'home' && mounted) {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Please sign in to view dashboard</div>
      </div>
    );
  }

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
    setHistoryLoading(false);
  };

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
      }
    } catch (err) {
      alert('Error deleting application!');
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

  const downloadHistoryResumePDF = (optimizedResume, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    const lines = doc.splitTextToSize(optimizedResume, maxLineWidth);
    let y = 20;
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 7;
    });
    doc.save(`resume-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`);
  };

  const downloadHistoryCoverLetterPDF = (coverLetter, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    const lines = doc.splitTextToSize(coverLetter, maxLineWidth);
    let y = 20;
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 7;
    });
    doc.save(`cover-letter-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const generateEmail = async () => {
    if (!emailJobTitle || !emailCompany || !emailContext) {
      alert('Please fill in all fields!');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType, jobTitle: emailJobTitle, companyName: emailCompany,
          optimizedResume: emailContext
        }),
      });
      const data = await res.json();
      setGeneratedEmail(data.emailContent);
    } catch (err) {
      alert('Error generating email!');
    }
    setEmailLoading(false);
  };

  const downloadEmailPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    const lines = doc.splitTextToSize(generatedEmail, maxLineWidth);
    let y = 20;
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 7;
    });
    doc.save(`${emailType}-email-${emailCompany.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  };

  const handleLinkedinFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setLinkedinFile(f);
    } else {
      alert('Please upload PDF only!');
    }
  };

  const optimizeLinkedin = async () => {
    if (!linkedinFile) {
      alert('Please upload your resume!');
      return;
    }
    setLinkedinLoading(true);
    const form = new FormData();
    form.append('resume', linkedinFile);
    form.append('targetRole', linkedinTargetRole);
    try {
      const res = await fetch('/api/linkedin-optimizer', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        alert('Error optimizing LinkedIn profile!');
        setLinkedinLoading(false);
        return;
      }
      setLinkedinResult(data);
    } catch (err) {
      alert('Error optimizing!');
    }
    setLinkedinLoading(false);
  };

  const handleInterviewFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setInterviewFile(f);
    } else {
      alert('Please upload PDF only!');
    }
  };

  const generateInterviewPrep = async () => {
    if (!interviewFile || !interviewJob) {
      alert('Please upload resume and paste job description!');
      return;
    }
    setInterviewLoading(true);
    const form = new FormData();
    form.append('resume', interviewFile);
    form.append('jobDescription', interviewJob);
    try {
      const res = await fetch('/api/interview-prep', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        alert('Error generating interview prep!');
        setInterviewLoading(false);
        return;
      }
      setInterviewQuestions(data.questions || []);
    } catch (err) {
      alert('Error generating prep!');
    }
    setInterviewLoading(false);
  };

  const renderSectionIcon = (sectionId) => {
    switch(sectionId) {
      case 'resumes': return <FileText size={18} />;
      case 'jobs': return <Briefcase size={18} />;
      case 'interviews': return <MessageCircle size={18} />;
      case 'tools': return <Wrench size={18} />;
      case 'growth': return <TrendingUp size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const renderItemIcon = (itemId) => {
    switch(itemId) {
      case 'history': return <HistoryIcon size={16} />;
      case 'versions': return <GitBranch size={16} />;
      case 'abtesting': return <BarChart3 size={16} />;
      case 'tracker': return <Target size={16} />;
      case 'analyzer': return <FileSearch size={16} />;
      case 'questions': return <MessageCircle size={16} />;
      case 'company-research': return <Building size={16} />;
      case 'linkedin': return <Linkedin size={16} />;
      case 'emails': return <Mail size={16} />;
      case 'networking': return <Users size={16} />;
      case 'skills-gap': return <BookOpen size={16} />;
      case 'salary': return <DollarSign size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const sections = [
    {
      id: 'resumes',
      name: 'My Resumes',
      items: [
        { id: 'history', name: 'Resume History' },
        { id: 'versions', name: 'Resume Versions', badge: 'Coming Soon' },
        { id: 'abtesting', name: 'A/B Testing', badge: 'Coming Soon' }
      ]
    },
    {
      id: 'jobs',
      name: 'Job Search',
      items: [
        { id: 'tracker', name: 'Application Tracker' },
        { id: 'analyzer', name: 'Job Description Analyzer', badge: 'Coming Soon' }
      ]
    },
    {
      id: 'interviews',
      name: 'Interview Prep',
      items: [
        { id: 'questions', name: 'Interview Questions' },
        { id: 'company-research', name: 'Company Research', badge: 'Coming Soon' }
      ]
    },
    {
      id: 'tools',
      name: 'Career Tools',
      items: [
        { id: 'linkedin', name: 'LinkedIn Optimizer' },
        { id: 'emails', name: 'Email Templates' },
        { id: 'networking', name: 'Networking Tracker', badge: 'Coming Soon' }
      ]
    },
    {
      id: 'growth',
      name: 'Career Growth',
      items: [
        { id: 'skills-gap', name: 'Skills Gap Analyzer', badge: 'Coming Soon' },
        { id: 'salary', name: 'Salary Negotiation', badge: 'Coming Soon' }
      ]
    }
  ];

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

  const renderContent = () => {
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
                      onClick={() => {
                        setActiveSection('emails');
                        setEmailJobTitle(app.job_title);
                        setEmailCompany(app.company_name);
                        setEmailType('follow-up');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                    >
                      <Mail size={14} /> Generate Follow-Up
                    </button>

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

          {applications.length > 0 && (
            <div className="mt-8 bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">📊 Your Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div>
                  <div className="text-3xl font-bold text-blue-300">{applications.filter(a => a.status === 'applied').length}</div>
                  <div className="text-blue-200 text-sm">Applied</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-300">{applications.filter(a => a.status === 'phone-screen').length}</div>
                  <div className="text-yellow-200 text-sm">Phone Screen</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-300">{applications.filter(a => a.status === 'interview').length}</div>
                  <div className="text-purple-200 text-sm">Interview</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-300">{applications.filter(a => a.status === 'offer').length}</div>
                  <div className="text-green-200 text-sm">Offers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-300">{applications.filter(a => a.status === 'rejected').length}</div>
                  <div className="text-red-200 text-sm">Rejected</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'home') {
      return (
        <div className="text-center py-12 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Welcome to Your Career Dashboard!</h2>
          <p className="text-purple-200 mb-8 text-lg">Select a tool from the menu to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.items[0].id)}
                className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/20 transition"
              >
                <div className="w-12 h-12 text-purple-300 mx-auto mb-3">
                  {renderSectionIcon(section.id)}
                </div>
                <h3 className="text-white font-semibold">{section.name}</h3>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'history') {
      return (
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Resume History</h2>
          {historyLoading ? (
            <div className="text-center py-12">
              <div className="text-white text-xl">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-200 text-xl mb-6">No resume scans yet. Start by analyzing your first resume!</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-600"
              >
                Analyze Resume
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((scan) => (
                <div 
                  key={scan.id}
                  className="bg-white/5 rounded-lg p-4 md:p-6 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                  onClick={() => setSelectedHistoryScan(selectedHistoryScan?.id === scan.id ? null : scan)}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{scan.job_title}</h3>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-purple-200 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {formatDate(scan.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 size={16} />
                          Score: {scan.score}%
                        </span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      scan.score >= 70 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {scan.score >= 70 ? '✓ Good Match' : '⚠ Needs Work'}
                    </div>
                  </div>

                  {selectedHistoryScan?.id === scan.id && (
                    <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {JSON.parse(scan.missing_keywords).map((kw, i) => (
                            <span key={i} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-white">Optimized Resume</h4>
                          <div className="flex gap-2 flex-wrap">
                            <button 
                              onClick={(e) => { e.stopPropagation(); copyText(scan.optimized_resume); }}
                              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                            >
                              <Copy size={16} /> Copy
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); downloadHistoryResumePDF(scan.optimized_resume, scan.job_title); }}
                              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                            >
                              <Download size={16} /> PDF
                            </button>
                          </div>
                        </div>
                        <pre className="bg-black/30 p-4 rounded-lg text-white text-sm whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                          {scan.optimized_resume}
                        </pre>
                      </div>

                      {scan.cover_letter && (
                        <div>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-white">Cover Letter</h4>
                            <div className="flex gap-2 flex-wrap">
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyText(scan.cover_letter); }}
                                className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                              >
                                <Copy size={16} /> Copy
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); downloadHistoryCoverLetterPDF(scan.cover_letter, scan.job_title); }}
                                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                              >
                                <Download size={16} /> PDF
                              </button>
                            </div>
                          </div>
                          <pre className="bg-black/30 p-4 rounded-lg text-white text-sm whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                            {scan.cover_letter}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'emails') {
      return (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="text-pink-500" size={32} />
            <h2 className="text-3xl md:text-4xl font-bold text-white">Email Templates</h2>
          </div>
          <p className="text-purple-200 mb-8">Generate professional emails for your job search instantly</p>

          <div className="mb-6">
            <label className="block text-white mb-3 font-semibold">Email Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setEmailType('follow-up')}
                className={`p-4 rounded-lg border-2 transition ${
                  emailType === 'follow-up'
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-purple-200 hover:border-purple-400'
                }`}
              >
                <Send size={24} className="mb-2" />
                <div className="font-semibold">Follow-Up</div>
                <div className="text-sm opacity-80">After applying</div>
              </button>
              <button
                onClick={() => setEmailType('thank-you')}
                className={`p-4 rounded-lg border-2 transition ${
                  emailType === 'thank-you'
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-purple-200 hover:border-purple-400'
                }`}
              >
                <Sparkles size={24} className="mb-2" />
                <div className="font-semibold">Thank You</div>
                <div className="text-sm opacity-80">After interview</div>
              </button>
              <button
                onClick={() => setEmailType('networking')}
                className={`p-4 rounded-lg border-2 transition ${
                  emailType === 'networking'
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-purple-200 hover:border-purple-400'
                }`}
              >
                <Mail size={24} className="mb-2" />
                <div className="font-semibold">Networking</div>
                <div className="text-sm opacity-80">Cold outreach</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div>
              <label className="block text-white mb-2 font-semibold">Job Title</label>
              <input
                type="text"
                value={emailJobTitle}
                onChange={(e) => setEmailJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-semibold">Company Name</label>
              <input
                type="text"
                value={emailCompany}
                onChange={(e) => setEmailCompany(e.target.value)}
                placeholder="e.g., Google"
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Your Background (Brief Summary)</label>
            <textarea
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
              rows={4}
              placeholder="Paste a brief summary of your experience or key skills relevant to this position..."
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
          </div>

          <button
            onClick={generateEmail}
            disabled={emailLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 text-lg"
          >
            {emailLoading ? 'Generating...' : '✨ Generate Email'}
          </button>

          {generatedEmail && (
            <div className="mt-8 bg-white/5 rounded-lg p-4 md:p-6 border border-white/20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-white">Your Email</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => copyText(generatedEmail)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    <Copy size={18} /> Copy
                  </button>
                  <button
                    onClick={downloadEmailPDF}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} /> PDF
                  </button>
                </div>
              </div>
              <div className="bg-black/30 p-4 md:p-6 rounded-lg">
                <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">
                  {generatedEmail}
                </pre>
              </div>
              <p className="text-purple-300 text-sm mt-4">
                💡 Tip: Add your own subject line and greeting before sending!
              </p>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'linkedin') {
      return (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Linkedin className="text-blue-400" size={32} />
            <h2 className="text-3xl md:text-4xl font-bold text-white">LinkedIn Profile Optimizer</h2>
          </div>
          <p className="text-purple-200 mb-8">Transform your resume into a compelling LinkedIn profile</p>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Upload Your Resume (PDF)</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleLinkedinFile} 
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Target Role (Optional)</label>
            <input
              type="text"
              value={linkedinTargetRole}
              onChange={(e) => setLinkedinTargetRole(e.target.value)}
              placeholder="e.g., Senior Product Manager"
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
            <p className="text-purple-300 text-sm mt-2">Leave blank to optimize based on your current experience</p>
          </div>

          <button
            onClick={optimizeLinkedin}
            disabled={linkedinLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 text-lg"
          >
            {linkedinLoading ? 'Optimizing...' : '✨ Optimize LinkedIn Profile'}
          </button>

          {linkedinResult && (
            <div>
              <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-8 border border-white/20 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={24} />
                    <h3 className="text-2xl font-bold text-white">LinkedIn Headline</h3>
                  </div>
                  <button
                    onClick={() => copyText(linkedinResult.headline)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Copy size={18} /> Copy
                  </button>
                </div>
                <div className="bg-black/30 p-4 md:p-6 rounded-lg">
                  <p className="text-white text-lg leading-relaxed">{linkedinResult.headline}</p>
                </div>
                <p className="text-purple-300 text-sm mt-2">💡 Max 220 characters - Perfect for LinkedIn!</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-8 border border-white/20 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={24} />
                    <h3 className="text-2xl font-bold text-white">About Section</h3>
                  </div>
                  <button
                    onClick={() => copyText(linkedinResult.about)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Copy size={18} /> Copy
                  </button>
                </div>
                <div className="bg-black/30 p-4 md:p-6 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">{linkedinResult.about}</pre>
                </div>
              </div>

              {linkedinResult.experiences && linkedinResult.experiences.map((exp, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-8 border border-white/20 mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="text-green-400" size={24} />
                      <div>
                        <h3 className="text-2xl font-bold text-white">{exp.title}</h3>
                        <p className="text-purple-300">{exp.company}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(exp.description)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Copy size={18} /> Copy
                    </button>
                  </div>
                  <div className="bg-black/30 p-4 md:p-6 rounded-lg">
                    <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">{exp.description}</pre>
                  </div>
                </div>
              ))}

              <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center">
                <p className="text-blue-100 text-lg">
                  🎉 Your LinkedIn profile is ready! Copy each section and paste directly into LinkedIn.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'questions') {
      return (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="text-green-400" size={32} />
            <h2 className="text-3xl md:text-4xl font-bold text-white">Interview Prep Assistant</h2>
          </div>
          <p className="text-purple-200 mb-8">Get personalized interview questions and answers based on your experience</p>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Upload Your Resume (PDF)</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleInterviewFile} 
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Job Description</label>
            <textarea
              value={interviewJob}
              onChange={(e) => setInterviewJob(e.target.value)}
              rows={6}
              placeholder="Paste the job description here..."
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
          </div>

          <button
            onClick={generateInterviewPrep}
            disabled={interviewLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition disabled:opacity-50 text-lg"
          >
            {interviewLoading ? 'Generating Interview Prep...' : '🎯 Generate Interview Questions'}
          </button>

          {interviewQuestions.length > 0 && (
            <div>
              <div className="bg-green-500/20 border border-green-500 rounded-xl p-6 my-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  ✅ {interviewQuestions.length} Questions Ready!
                </h3>
                <p className="text-green-100">
                  Click each question to see your personalized answer and tips
                </p>
              </div>

              <div className="space-y-4">
                {interviewQuestions.map((q, index) => (
                  <div 
                    key={index}
                    className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
                  >
                    <div 
                      onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                      className="p-4 md:p-6 cursor-pointer hover:bg-white/5 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-white mb-2">{q.question}</h3>
                          <p className="text-purple-300 text-sm">
                            {expandedQuestion === index ? 'Click to collapse' : 'Click to see answer & tips'}
                          </p>
                        </div>
                        <div className={`text-white transition-transform ${expandedQuestion === index ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </div>
                    </div>

                    {expandedQuestion === index && (
                      <div className="border-t border-white/20 p-4 md:p-6 bg-black/20">
                        <div className="mb-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={20} />
                              <h4 className="text-lg font-semibold text-white">Suggested Answer</h4>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyText(q.answer); }}
                              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                            >
                              <Copy size={16} /> Copy
                            </button>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <p className="text-white leading-relaxed">{q.answer}</p>
                          </div>
                        </div>

                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                            <div>
                              <h5 className="text-yellow-300 font-semibold mb-1">Pro Tip</h5>
                              <p className="text-yellow-100 text-sm">{q.tip}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center">
                <p className="text-blue-100 text-lg">
                  💡 Practice these answers out loud! Record yourself or practice with a friend for best results.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🚀</div>
        <h2 className="text-3xl font-bold text-white mb-4">Coming Soon!</h2>
        <p className="text-purple-200 text-lg mb-8">This feature is under development and will be available soon.</p>
        <button
          onClick={() => setActiveSection('home')}
          className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="lg:hidden bg-white/10 backdrop-blur-lg border-b border-white/20 p-4 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        <div className="hidden lg:block w-64 bg-white/5 backdrop-blur-lg border-r border-white/20 min-h-screen p-6 sticky top-0 h-screen overflow-y-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white mb-8 hover:text-purple-200 transition"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => setActiveSection('home')}
            className="w-full mb-6"
          >
            <h2 className="text-2xl font-bold text-white text-left">Dashboard</h2>
          </button>

          <nav className="space-y-6">
            {sections.map(section => (
              <div key={section.id}>
                <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                  {renderSectionIcon(section.id)}
                  <span>{section.name}</span>
                </div>
                <div className="ml-6 space-y-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center justify-between w-full p-2 rounded text-sm transition ${
                        activeSection === item.id
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {renderItemIcon(item.id)}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="bg-purple-900 w-72 h-full overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-white mb-8 hover:text-purple-200"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full mb-6"
              >
                <h2 className="text-2xl font-bold text-white text-left">Dashboard</h2>
              </button>

              <nav className="space-y-6">
                {sections.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                      {renderSectionIcon(section.id)}
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
                          className={`flex items-center justify-between w-full p-2 rounded text-sm transition ${
                            activeSection === item.id
                              ? 'bg-purple-600 text-white'
                              : 'text-purple-200 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {renderItemIcon(item.id)}
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      
      </div>

    </div>
  );
}
