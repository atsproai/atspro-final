'use client';
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Users, ArrowRight, Copy, Download } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { jsPDF } from 'jspdf';

export default function App() {
  const { isSignedIn, user } = useUser();
  const [page, setPage] = useState('home');
  const [file, setFile] = useState(null);
  const [job, setJob] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scansRemaining, setScansRemaining] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

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
    
    if (!file || !job) {
      alert('Need resume AND job description!');
      return;
    }
    
    setLoading(true);
    setLimitReached(false);
    
    const form = new FormData();
    form.append('resume', file);
    form.append('jobDescription', job);

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

  if (page === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">ATSpro.ai</h1>
          <div className="flex items-center space-x-6">
            <button onClick={() => setPage('home')} className="text-white hover:text-purple-200">Home</button>
            <button onClick={() => setPage('analyzer')} className="text-white hover:text-purple-200">Analyzer</button>
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
          <p className="text-2xl text-purple-100 mb-2">AI optimizes your resume + generates a cover letter</p>
          <p className="text-xl text-purple-200 mb-8">Download as PDF or Text • Ready in seconds</p>
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
              <div className="text-5xl font-bold text-white mb-2">2X</div>
              <div className="text-purple-200">Interview Rate</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">What You Get</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">ATS-Optimized Resume</h4>
                  <p className="text-purple-200">AI rewrites your resume with job-specific keywords to pass applicant tracking systems</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Custom Cover Letter</h4>
                  <p className="text-purple-200">Personalized cover letter tailored to the job using your actual experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">PDF & Text Downloads</h4>
                  <p className="text-purple-200">Download both resume and cover letter in PDF or text format</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Instant Results</h4>
                  <p className="text-purple-200">Get your optimized resume and cover letter in under 30 seconds</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-4xl font-bold text-white mb-8">Simple Pricing</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Free</h4>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <div className="text-purple-200 mb-6">1 resume + cover letter</div>
              <ul className="text-left text-purple-200 text-sm mb-6 space-y-2">
                <li>✓ ATS-optimized resume</li>
                <li>✓ Custom cover letter</li>
                <li>✓ PDF & text downloads</li>
              </ul>
              <button onClick={() => setPage('analyzer')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Try Free
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Monthly</h4>
              <div className="text-4xl font-bold text-white mb-2">$14<span className="text-lg">/mo</span></div>
              <div className="text-purple-200 mb-6">Unlimited scans</div>
              <ul className="text-left text-purple-200 text-sm mb-6 space-y-2">
                <li>✓ Everything in Free</li>
                <li>✓ Unlimited resumes</li>
                <li>✓ Unlimited cover letters</li>
                <li>✓ Priority support</li>
              </ul>
              <button onClick={() => handleCheckout('price_1SfCtLAwfYeu0c4ApXwqfyUR')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
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
              <button onClick={() => handleCheckout('price_1SfCtuAwfYeu0c4AhdFPWnyj')} className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800">
                Start Trial
              </button>
            </div>
          </div>
          <p className="text-purple-200 mt-6">⭐ 7-day free trial • Cancel anytime • No commitments</p>
        </div>
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
              <p className="text-red-100 mb-4">Upgrade to get unlimited resume scans + cover letters</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handleCheckout('price_1SfCtLAwfYeu0c4ApXwqfyUR')} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
                  $14/month
                </button>
                <button onClick={() => handleCheckout('price_1SfCtuAwfYeu0c4AhdFPWnyj')} className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600">
                  $120/year (Save $48!)
                </button>
              </div>
            </div>
          )}
          
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
              </div>
              <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">{result.optimizedResume}</pre>
            </div>

            {result.coverLetter && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white">Cover Letter</h3>
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
                </div>
                <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">{result.coverLetter}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
