'use client';
import React, { useState } from 'react';
import { Upload, CheckCircle, Users, ArrowRight, Copy, Download } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

export default function App() {
  const { isSignedIn, user } = useUser();
  const [page, setPage] = useState('home');
  const [file, setFile] = useState(null);
  const [job, setJob] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const form = new FormData();
    form.append('resume', file);
    form.append('jobDescription', job);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await res.json();
      setResult(data);
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

  const downloadResume = () => {
    const blob = new Blob([result.optimizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.txt';
    a.click();
  };

  const copyText = () => {
    navigator.clipboard.writeText(result.optimizedResume);
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
          <p className="text-2xl text-purple-100 mb-4">AI fixes your resume in seconds</p>
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
              <div className="text-5xl font-bold text-white mb-2">$120/yr</div>
              <div className="text-purple-200">Best Deal</div>
            </div>
          </div>

          <h3 className="text-4xl font-bold text-white mb-8">Simple Pricing</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Free</h4>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <div className="text-purple-200 mb-6">1 resume scan</div>
              <button onClick={() => setPage('analyzer')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Try Free
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h4 className="text-2xl font-bold text-white mb-4">Monthly</h4>
              <div className="text-4xl font-bold text-white mb-2">$14<span className="text-lg">/mo</span></div>
              <div className="text-purple-200 mb-6">Unlimited scans + downloads</div>
              <button onClick={() => handleCheckout('price_1SfCtLAwfYeu0c4ApXwqfyUR')} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Start Trial
              </button>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-xl relative">
              <div className="absolute top-4 right-4 bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">BEST VALUE</div>
              <h4 className="text-2xl font-bold text-black mb-4">Annual</h4>
              <div className="text-4xl font-bold text-black mb-2">$120<span className="text-lg">/yr</span></div>
              <div className="text-black mb-6">Save $48/year!</div>
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

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">AI-Optimized Resume</h3>
                <div className="flex gap-2">
                  <button onClick={copyText} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    <Copy size={18} /> Copy
                  </button>
                  <button onClick={downloadResume} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <Download size={18} /> Download
                  </button>
                </div>
              </div>
              <pre className="bg-black/30 p-6 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">{result.optimizedResume}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
