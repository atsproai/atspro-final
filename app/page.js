'use client';
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Users, ArrowRight, Copy, Download, Lock } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { jsPDF } from 'jspdf';

export default function App() {
  const { isSignedIn, user } = useUser();
  const [page, setPage] = useState('home');
  const [file, setFile] = useState(null);
  const [job, setJob] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scansRemaining, setScansRemaining] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');

  useEffect(() => {
    if (isSignedIn && user?.primaryEmailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [isSignedIn, user]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      alert('Please upload PDF only!');
    }
  };

  const analyze = async () => {
    if (!isSignedIn) {
      alert('Please sign in to analyze resumes!');
      return;
    }

    if (!email) {
      alert('Please enter your email address!');
      return;
    }
    
    if (!file || !job) {
      alert('Need resume AND job description!');
      return;
    }
    
    setLoading(true);
    setLimitReached(false);
    
    const form = new FormData();
    form.append('resume', file);
    form.append('jobDescription', job);
    form.append('email', email);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await res.json();
      
      if (res.status === 403 && data.limitReached) {
        setLimitReached(true);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        alert('Error analyzing resume!');
        setLoading(false);
        return;
      }
      
      setResult(data);
      setScansRemaining(data.scansRemaining);
      setSubscriptionStatus(data.subscriptionStatus || 'free');
    } catch (err) {
      alert('Error analyzing!');
    }
    setLoading(false);
  };

  const handleCheckout = async (priceId) => {
    if (!isSignedIn) {
      alert('Please sign in first!');
      return;
    }
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Error starting checkout!');
    }
  };

  const downloadResumePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(result.optimizedResume, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    doc.save('optimized-resume.pdf');
  };

  const downloadResumeText = () => {
    const blob = new Blob([result.optimizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.txt';
    a.click();
  };

  const downloadCoverLetterPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(result.coverLetter, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    doc.save('cover-letter.pdf');
  };

  const downloadCoverLetterText = () => {
    const blob = new Blob([result.coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    a.click();
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const isPaidUser = subscriptionStatus === 'monthly' || subscriptionStatus === 'annual';

  // FAQ Component
  const FAQ = () => {
    const [openIndex, setOpenIndex] = React.useState(null);

    const faqs = [
      {
        q: "How does the 7-day free trial work?",
        a: "Start your trial with any paid plan - we won't charge you for 7 days. Use all features unlimited during the trial. Cancel anytime before day 7 ends and you'll never be charged. After 7 days, your subscription starts automatically."
      },
      {
        q: "What ATS systems do you support?",
        a: "We test your resume against the 4 most popular ATS systems: Workday, Greenhouse, Lever, and Taleo. These are used by 80%+ of Fortune 500 companies. Our AI optimizes your resume to pass all of them."
      },
      {
        q: "Can I cancel anytime?",
        a: "Absolutely! Cancel anytime with one click in your dashboard. No questions asked, no cancellation fees. Your subscription stops at the end of your current billing period."
      },
      {
        q: "How is this different from other resume tools?",
        a: "Most ATS checkers just give you a score. We actually rewrite your resume with AI, check compatibility with 4 major ATS systems, generate cover letters, optimize your LinkedIn, and include interview prep. Plus our early adopter pricing ($14/mo) is 40% cheaper than competitors."
      },
      {
        q: "What's your refund policy?",
        a: "Monthly Plan: Use the 7-day free trial risk-free. Cancel before it ends = $0 charged. After the trial, you can cancel anytime but we don't offer refunds for partial months. Annual Plan: 30-day money-back guarantee, no questions asked. If you're not satisfied within 30 days of purchase, we'll refund you in full."
      },
      {
        q: "What if I'm not getting interviews after using this?",
        a: "We're here to help! Email us at koorahthebest@gmail.com and we'll personally review your resume and application strategy. Our goal is your success - if our tool isn't working for you, we want to know so we can make it better."
      },
      {
        q: "Do you store my resume data?",
        a: "We only store your resumes in your private, secure account. You can delete them anytime. We never share your data with third parties or use it for anything other than providing you our service."
      },
      {
        q: "Can I use this for multiple jobs?",
        a: "Yes! Paid users get unlimited resume optimizations. We recommend creating a tailored resume for each job you apply to - that's when our tool works best."
      }
    ];

    return (
      <div className="max-w-4xl mx-auto mb-20">
        <h3 className="text-4xl font-bold text-white mb-4 text-center">Frequently Asked Questions</h3>
        <p className="text-purple-200 text-center mb-8">Everything you need to know about ATSpro.ai</p>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-white/5 transition"
              >
                <span className="text-white font-semibold text-lg pr-8">{faq.q}</span>
                <span className="text-purple-300 text-2xl flex-shrink-0">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-purple-200 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-purple-200 mb-4">Still have questions?</p>
          <a 
            href="mailto:koorahthebest@gmail.com" 
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  };

  // Footer Component
  const Footer = () => (
    <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-xl mb-4">ATSpro.ai</h3>
            <p className="text-purple-200 text-sm">
              AI-powered job search assistant helping you land your dream job.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li><button onClick={() => setPage('analyzer')} className="hover:text-white">Resume Analyzer</button></li>
              <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
              <li><a href="/history" className="hover:text-white">History</a></li>
              <li><a href="/email-templates" className="hover:text-white">Email Templates</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li>
                <a href="mailto:koorahthebest@gmail.com" className="hover:text-white">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:koorahthebest@gmail.com?subject=Bug Report" className="hover:text-white">
                  Report a Bug
                </a>
              </li>
              <li>
                <a href="mailto:koorahthebest@gmail.com?subject=Feature Request" className="hover:text-white">
                  Request a Feature
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li>
                <a href="mailto:koorahthebest@gmail.com" className="hover:text-white">
                  koorahthebest@gmail.com
                </a>
              </li>
              <li>
                <a href="mailto:koorahthebest@gmail.com?subject=Business Inquiry" className="hover:text-white">
                  Business Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-purple-300 text-sm">
            © 2025 ATSpro.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );

  if (page === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        {/* Early Adopter Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center py-2 px-4">
          <p className="text-sm md:text-base font-semibold">
            🔥 Early Adopter Pricing: Lock in $14/month FOREVER (Regular price $24.99) - Limited Time!
          </p>
        </div>

        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">ATSpro.ai</h1>
          <div className="flex items-center space-x-6">
            <button onClick={() => setPage('home')} className="text-white hover:text-purple-200">Home</button>
            <button onClick={() => setPage('analyzer')} className="text-white hover:text-purple-200">Analyzer</button>
            <button onClick={() => window.location.href = '/dashboard'} className="text-white hover:text-purple-200">Dashboard</button>
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold hover:bg-purple-100">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-6xl font-bold text-white mb-6">Beat the ATS</h2>
          <p className="text-2xl text-purple-100 mb-2">Complete AI-Powered Job Search Assistant</p>
          <p className="text-xl text-purple-200 mb-8">Resume Optimization • Interview Prep • Job Tracking • Career Tools</p>
          <button onClick={() => setPage('analyzer')} className="bg-pink-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-pink-600 transition inline-flex items-center gap-2 mb-16">
            Try Free Now <ArrowRight size={20} />
          </button>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-5xl font-bold text-white mb-2">94%</div>
              <div className="text-purple-200">Success Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-5xl font-bold text-white mb-2">50K+</div>
              <div className="text-purple-200">Resumes Fixed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-5xl font-bold text-white mb-2">15+</div>
              <div className="text-purple-200">Career Tools</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">Everything You Need to Land Your Dream Job</h3>
            
            {/* ATS Compatibility Showcase */}
            <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-pink-500 rounded-xl p-6 mb-8">
              <h4 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                🎯 ATS System Compatibility Checker
              </h4>
              <p className="text-purple-100 mb-4">
                Get instant compatibility scores for the 4 most popular ATS systems used by Fortune 500 companies
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-3 text-center">
                  <div className="font-bold text-white mb-1">Workday</div>
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">PASS</div>
                </div>
                <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-3 text-center">
                  <div className="font-bold text-white mb-1">Greenhouse</div>
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">PASS</div>
                </div>
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-3 text-center">
                  <div className="font-bold text-white mb-1">Lever</div>
                  <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">WARNING</div>
                </div>
                <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-3 text-center">
                  <div className="font-bold text-white mb-1">Taleo</div>
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">PASS</div>
                </div>
              </div>
              <p className="text-purple-200 text-sm mt-4 text-center">
                ✨ See exactly how your resume performs on each system + get specific formatting fixes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">ATS-Optimized Resumes</h4>
                  <p className="text-purple-200">AI rewrites your resume with job-specific keywords. Test compatibility with Workday, Greenhouse, Lever & Taleo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Interview Preparation</h4>
                  <p className="text-purple-200">Get personalized interview questions and answers based on your experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Job Application Tracker</h4>
                  <p className="text-purple-200">Track all your applications and manage your job search pipeline</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">LinkedIn & Email Tools</h4>
                  <p className="text-purple-200">Optimize your LinkedIn profile and generate professional emails</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgency Box */}
          <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-2xl p-6 md:p-8 backdrop-blur-lg">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Early Adopter Pricing
              </h3>
              <p className="text-xl text-yellow-200 mb-4">
                Lock in $14/month FOREVER and save $131/year
              </p>
              <p className="text-purple-200 max-w-2xl mx-auto mb-4">
                We're raising prices to $24.99/month soon. Sign up now and you'll never pay more than $14/month, even when prices increase. This is a one-time opportunity!
              </p>
              <div className="bg-purple-500/30 border border-purple-400 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
                <p className="text-white font-semibold mb-2">🚀 Plus: New Features Coming Soon!</p>
                <p className="text-purple-100 text-sm">
                  Skills Gap Analysis • Salary Negotiation Tools • Resume Versions • Browser Extension • And more!
                </p>
              </div>
              <div className="mt-4 inline-block bg-white/10 px-6 py-2 rounded-full">
                <p className="text-sm text-white">
                  <span className="font-bold text-yellow-300">Regular Price:</span> <span className="line-through">$24.99/mo</span> → 
                  <span className="font-bold text-green-300"> Early Adopter: $14/mo</span>
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-3 text-center">Why Choose ATSpro.ai?</h3>
            <p className="text-purple-200 text-center mb-8">See how we stack up against the competition</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="p-4 text-white font-semibold">Feature</th>
                    <th className="p-4 text-center">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                        <div className="text-white font-bold text-lg">ATSpro.ai</div>
                        <div className="text-yellow-300 text-sm">🔥 You're Here!</div>
                      </div>
                    </th>
                    <th className="p-4 text-center text-purple-200">Jobscan</th>
                    <th className="p-4 text-center text-purple-200">Rezi</th>
                    <th className="p-4 text-center text-purple-200">Teal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Price per month</td>
                    <td className="p-4 text-center">
                      <div className="text-green-400 font-bold text-xl">$14</div>
                      <div className="text-xs text-green-300">Early adopter!</div>
                    </td>
                    <td className="p-4 text-center text-purple-200">$49.95</td>
                    <td className="p-4 text-center text-purple-200">$29</td>
                    <td className="p-4 text-center text-purple-200">$29</td>
                  </tr>
                  
                  <tr className="border-b border-white/10 bg-pink-500/10">
                    <td className="p-4 text-purple-100 font-semibold">
                      ATS System Compatibility Check
                      <div className="text-xs text-pink-300 font-normal">Workday, Greenhouse, Lever, Taleo</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-green-400 text-2xl">✓</span>
                      <div className="text-xs text-green-300 font-semibold">All 4 systems!</div>
                    </td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">AI Resume Optimization</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Cover Letter Generation</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">LinkedIn Profile Optimizer</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Professional Email Templates</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Interview Preparation</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Job Application Tracker</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-red-400 text-2xl">✗</td>
                    <td className="p-4 text-center text-green-400 text-2xl">✓</td>
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-4 text-purple-100 font-semibold">Free Trial</td>
                    <td className="p-4 text-center">
                      <span className="text-green-400 text-2xl">✓</span>
                      <div className="text-xs text-green-300">7 days</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-yellow-400 text-2xl">✓</span>
                      <div className="text-xs text-purple-200">Limited</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-yellow-400 text-2xl">✓</span>
                      <div className="text-xs text-purple-200">7 days</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-yellow-400 text-2xl">✓</span>
                      <div className="text-xs text-purple-200">Limited</div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="p-4"></td>
                    <td className="p-4 text-center">
                      <button onClick={() => setPage('analyzer')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition">
                        Try Free Now →
                      </button>
                    </td>
                    <td className="p-4 text-center text-purple-300 text-sm">Starting at $49.95/mo</td>
                    <td className="p-4 text-center text-purple-300 text-sm">Starting at $29/mo</td>
                    <td className="p-4 text-center text-purple-300 text-sm">Starting at $29/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-purple-200 text-sm">
                💡 <span className="font-semibold text-white">Why we're cheaper:</span> We're new and want to help job seekers. 
                Lock in this price before we raise it to $24.99/mo!
              </p>
            </div>
          </div>

          <h3 className="text-4xl font-bold text-white mb-8">Simple Pricing</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Free</h4>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <div className="text-purple-200 mb-6">Try all features</div>
              <ul className="text-left text-purple-200 text-sm mb-6 space-y-2">
                <li>✓ 1 Resume optimization</li>
                <li>✓ 1 Cover letter</li>
                <li>✓ Interview prep</li>
                <li>✓ All career tools</li>
                <li>✓ Job tracker access</li>
              </ul>
              <button onClick={() => setPage('analyzer')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Try Free
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Monthly</h4>
              <div className="text-4xl font-bold text-white mb-2">$14<span className="text-lg">/mo</span></div>
              <div className="text-purple-200 mb-6">Unlimited everything</div>
              <ul className="text-left text-purple-200 text-sm mb-6 space-y-2">
                <li>✓ Unlimited resumes</li>
                <li>✓ Unlimited cover letters</li>
                <li>✓ Unlimited interview prep</li>
                <li>✓ All features unlocked</li>
                <li>✓ Priority support</li>
              </ul>
              <button onClick={() => handleCheckout('price_1SfvfjAwfYeu0c4AHrF1yEQo')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Start Trial
              </button>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-xl relative">
              <div className="absolute top-4 right-4 bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">BEST VALUE</div>
              <h4 className="text-2xl font-bold text-black mb-4">Annual</h4>
              <div className="text-4xl font-bold text-black mb-2">$120<span className="text-lg">/yr</span></div>
              <div className="text-black mb-6">Save $48/year!</div>
              <ul className="text-left text-black text-sm mb-6 space-y-2">
                <li>✓ Everything in Monthly</li>
                <li>✓ 2 months free</li>
                <li>✓ Lifetime updates</li>
                <li>✓ VIP support</li>
              </ul>
              <button onClick={() => handleCheckout('price_1SfvjAAwfYeu0c4AI6M1tnjv')} className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800">
                Start Trial
              </button>
            </div>
          </div>
          <p className="text-purple-200 mt-6">⭐ 7-day free trial • Cancel anytime • No commitments</p>
        </div>

        <FAQ />

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white">ATSpro.ai</h1>
        <div className="flex items-center space-x-6">
          <button onClick={() => setPage('home')} className="text-white hover:text-purple-200">Home</button>
          <button onClick={() => setPage('analyzer')} className="text-white hover:text-purple-200">Analyzer</button>
          <button onClick={() => window.location.href = '/dashboard'} className="text-white hover:text-purple-200">Dashboard</button>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold hover:bg-purple-100">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
          <h2 className="text-3xl font-bold text-white mb-6">Resume Analyzer</h2>
          
          {!isSignedIn && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-100 text-center">
                Please <SignInButton mode="modal"><button className="underline font-semibold">sign in</button></SignInButton> to analyze resumes
              </p>
            </div>
          )}

          {limitReached && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Free Scan Used!</h3>
              <p className="text-red-100 mb-4">Upgrade to get unlimited resume scans + all features</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handleCheckout('price_1SfvfjAwfYeu0c4AHrF1yEQo')} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
                  $14/month
                </button>
                <button onClick={() => handleCheckout('price_1SfvjAAwfYeu0c4AI6M1tnjv')} className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600">
                  $120/year (Save $48!)
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your@email.com"
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300" 
              disabled={!isSignedIn} 
            />
            <p className="text-purple-300 text-sm mt-1">We'll send your optimized resume to this email</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Upload Resume (PDF)</label>
            <input type="file" accept=".pdf" onChange={handleFile} className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30" disabled={!isSignedIn} />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Job Description</label>
            <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={6} placeholder="Paste the job description here..." className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-200" disabled={!isSignedIn} />
          </div>

          <button onClick={analyze} disabled={loading || !isSignedIn} className="w-full bg-white text-purple-900 py-3 rounded-lg font-semibold hover:bg-purple-100 transition disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        {result && (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
              <div className="text-center mb-6">
                <div className="text-7xl font-bold text-white mb-2">{result.score}%</div>
                <div className={`text-xl font-semibold ${result.score >= 70 ? 'text-green-300' : 'text-yellow-300'}`}>
                  {result.score >= 70 ? '✓ Good match for ATS systems' : '⚠ Needs optimization to pass ATS systems'}
                </div>
              </div>
            </div>

            {result.atsCompatibility && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">🎯 ATS System Compatibility</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.atsCompatibility.workday && (
                    <div className={`p-4 rounded-lg border-2 ${
                      result.atsCompatibility.workday.startsWith('PASS') 
                        ? 'bg-green-500/20 border-green-500' 
                        : result.atsCompatibility.workday.startsWith('WARNING')
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-red-500/20 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white">Workday</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.atsCompatibility.workday.startsWith('PASS') 
                            ? 'bg-green-500 text-white' 
                            : result.atsCompatibility.workday.startsWith('WARNING')
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}>
                          {result.atsCompatibility.workday.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-white opacity-90">
                        {result.atsCompatibility.workday.split(' - ')[1]}
                      </p>
                    </div>
                  )}
                  
                  {result.atsCompatibility.greenhouse && (
                    <div className={`p-4 rounded-lg border-2 ${
                      result.atsCompatibility.greenhouse.startsWith('PASS') 
                        ? 'bg-green-500/20 border-green-500' 
                        : result.atsCompatibility.greenhouse.startsWith('WARNING')
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-red-500/20 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white">Greenhouse</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.atsCompatibility.greenhouse.startsWith('PASS') 
                            ? 'bg-green-500 text-white' 
                            : result.atsCompatibility.greenhouse.startsWith('WARNING')
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}>
                          {result.atsCompatibility.greenhouse.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-white opacity-90">
                        {result.atsCompatibility.greenhouse.split(' - ')[1]}
                      </p>
                    </div>
                  )}
                  
                  {result.atsCompatibility.lever && (
                    <div className={`p-4 rounded-lg border-2 ${
                      result.atsCompatibility.lever.startsWith('PASS') 
                        ? 'bg-green-500/20 border-green-500' 
                        : result.atsCompatibility.lever.startsWith('WARNING')
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-red-500/20 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white">Lever</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.atsCompatibility.lever.startsWith('PASS') 
                            ? 'bg-green-500 text-white' 
                            : result.atsCompatibility.lever.startsWith('WARNING')
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}>
                          {result.atsCompatibility.lever.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-white opacity-90">
                        {result.atsCompatibility.lever.split(' - ')[1]}
                      </p>
                    </div>
                  )}
                  
                  {result.atsCompatibility.taleo && (
                    <div className={`p-4 rounded-lg border-2 ${
                      result.atsCompatibility.taleo.startsWith('PASS') 
                        ? 'bg-green-500/20 border-green-500' 
                        : result.atsCompatibility.taleo.startsWith('WARNING')
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-red-500/20 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white">Taleo</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.atsCompatibility.taleo.startsWith('PASS') 
                            ? 'bg-green-500 text-white' 
                            : result.atsCompatibility.taleo.startsWith('WARNING')
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}>
                          {result.atsCompatibility.taleo.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-white opacity-90">
                        {result.atsCompatibility.taleo.split(' - ')[1]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.formattingIssues && result.formattingIssues !== 'None detected' && (
              <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-white mb-3">⚠️ Formatting Issues Detected</h3>
                <p className="text-white">{result.formattingIssues}</p>
                <p className="text-orange-200 text-sm mt-3">
                  💡 Tip: Fix these issues in your optimized resume for better ATS parsing
                </p>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.missing.map((kw, i) => (
                  <span key={i} className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm">{kw}</span>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">AI-Optimized Resume</h3>
                {isPaidUser && (
                  <div className="flex gap-2">
                    <button onClick={() => copyText(result.optimizedResume)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                      <Copy size={18} /> Copy
                    </button>
                    <button onClick={downloadResumePDF} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <Download size={18} /> PDF
                    </button>
                    <button onClick={downloadResumeText} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      <Download size={18} /> Text
                    </button>
                  </div>
                )}
              </div>

              {!isPaidUser ? (
                <div className="relative">
                  <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm mb-4">
                    {result.optimizedResume.substring(0, 400)}...
                  </pre>
                  <div className="relative">
                    <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm blur-sm select-none">
                      {result.optimizedResume.substring(400, 800)}
                    </pre>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-center bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-xl max-w-md">
                        <Lock className="w-16 h-16 text-white mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">🔒 Unlock Full Resume</h3>
                        <p className="text-white mb-6">✨ See your complete optimized resume + cover letter</p>
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => handleCheckout('price_1SfvfjAwfYeu0c4AHrF1yEQo')} 
                            className="bg-white text-purple-900 px-6 py-4 rounded-lg font-bold hover:bg-purple-100 transition text-lg"
                          >
                            🎁 Start 7-Day FREE Trial - $14/mo
                          </button>
                          <p className="text-white text-xs -mt-2 mb-2">Cancel anytime • Unlock instantly</p>
                          <button 
                            onClick={() => handleCheckout('price_1SfvjAAwfYeu0c4AI6M1tnjv')} 
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-orange-600 transition text-lg"
                          >
                            💎 Best Value - $120/year (Save $48!)
                          </button>
                          <p className="text-white text-xs -mt-2">Includes 7-Day FREE Trial</p>
                        </div>
                        <p className="text-white text-xs mt-4 opacity-75">✓ Download PDF/Text • ✓ Access all features</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">{result.optimizedResume}</pre>
              )}
            </div>

            {result.coverLetter && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white">Cover Letter</h3>
                  {isPaidUser && (
                    <div className="flex gap-2">
                      <button onClick={() => copyText(result.coverLetter)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                        <Copy size={18} /> Copy
                      </button>
                      <button onClick={downloadCoverLetterPDF} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Download size={18} /> PDF
                      </button>
                      <button onClick={downloadCoverLetterText} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Download size={18} /> Text
                      </button>
                    </div>
                  )}
                </div>
                
                {!isPaidUser ? (
                  <div className="relative">
                    <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm blur-lg select-none">
                      {result.coverLetter}
                    </pre>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white bg-purple-900/90 px-6 py-3 rounded-lg">
                        <Lock size={20} />
                        <span className="font-semibold">Upgrade to unlock cover letter</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">{result.coverLetter}</pre>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
