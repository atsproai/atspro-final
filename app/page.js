'use client'
import React, { useState } from 'react';
import { Upload, CheckCircle, Users, ArrowRight, Copy, Download } from 'lucide-react';

export default function App() {
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
      alert('Error! Try again!');
    }
    setLoading(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  const downloadAsText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-800">
      <nav className="bg-black/20 p-4 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-white text-2xl font-bold">ATSpro.ai</div>
          <div className="flex gap-6">
            <button onClick={() => setPage('home')} className="text-white hover:text-pink-300 transition">Home</button>
            <button onClick={() => setPage('analyzer')} className="text-white hover:text-pink-300 transition">Analyzer</button>
          </div>
        </div>
      </nav>

      {page === 'home' && (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Beat the ATS</h1>
          <p className="text-2xl text-purple-200 mb-8">AI fixes your resume in seconds</p>
          <button 
            onClick={() => setPage('analyzer')}
            className="bg-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-pink-600 transition transform hover:scale-105"
          >
            Try Free Now <ArrowRight className="inline ml-2" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="text-4xl font-bold text-pink-300">94%</div>
              <div className="text-white mt-2">Success Rate</div>
            </div>
            <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="text-4xl font-bold text-pink-300">50K+</div>
              <div className="text-white mt-2">Resumes Fixed</div>
            </div>
            <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="text-4xl font-bold text-pink-300">$120/yr</div>
              <div className="text-white mt-2">Best Deal</div>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Simple Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-pink-300 mb-4">$0</div>
                <p className="text-purple-200 mb-4">1 resume scan</p>
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg w-full hover:bg-purple-500 transition">Try Free</button>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                <div className="text-4xl font-bold text-pink-300 mb-4">$14<span className="text-lg">/mo</span></div>
                <p className="text-purple-200 mb-4">Unlimited scans + downloads</p>
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg w-full hover:bg-purple-500 transition">Start Trial</button>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 transform scale-105">
                <div className="text-xs bg-white text-orange-600 px-3 py-1 rounded-full inline-block mb-2 font-bold">BEST VALUE</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">$120<span className="text-lg">/yr</span></div>
                <p className="text-gray-800 mb-4">Save $48/year!</p>
                <button className="bg-gray-900 text-white px-6 py-2 rounded-lg w-full hover:bg-gray-800 transition">Start Trial</button>
              </div>
            </div>
            <p className="text-purple-200 mt-6 text-sm">✨ 7-day free trial • Cancel anytime • No commitments</p>
          </div>
        </div>
      )}

      {page === 'analyzer' && (
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-white text-center mb-12">Resume Analyzer</h1>

          {!result ? (
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="mb-8">
                <label className="block text-white text-xl mb-4 font-semibold">1. Upload Resume (PDF)</label>
                <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center hover:border-purple-300 transition cursor-pointer">
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <input type="file" accept=".pdf" onChange={handleFile} className="hidden" id="upload" />
                  <label htmlFor="upload" className="cursor-pointer text-purple-300 text-lg">
                    {file ? <span className="text-green-400 font-semibold">✓ {file.name}</span> : 'Click to Upload PDF'}
                  </label>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-white text-xl mb-4 font-semibold">2. Paste Job Description</label>
                <textarea
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-48 p-4 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-purple-400/30 focus:border-purple-400 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={analyze}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl text-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing with AI...
                  </span>
                ) : 'Analyze Resume'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
                <h2 className="text-2xl font-bold text-white mb-6">ATS Compatibility Score</h2>
                <div className="text-7xl font-bold text-white mb-4">{result.score}%</div>
                <p className="text-purple-200 text-lg">
                  {result.score >= 80 ? '🎉 Excellent! Your resume is ATS-friendly' : 
                   result.score >= 60 ? '👍 Good, but room for improvement' : 
                   '⚠️ Needs optimization to pass ATS systems'}
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-6">Missing Keywords</h2>
                <div className="flex flex-wrap gap-3">
                  {result.missingKeywords?.map((kw, i) => (
                    <span key={i} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">AI-Optimized Resume</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.optimizedResume, 'Resume')}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                      onClick={() => downloadAsText(result.optimizedResume, 'optimized-resume.txt')}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {result.optimizedResume}
                  </pre>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">AI-Generated Cover Letter</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.coverLetter, 'Cover Letter')}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                      onClick={() => downloadAsText(result.coverLetter, 'cover-letter.txt')}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <pre className="text-slate-200 whitespace-pre-wrap font-serif text-sm leading-relaxed">
                    {result.coverLetter}
                  </pre>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  🎉 Want unlimited scans and downloads?
                </h3>
                <p className="text-purple-100 mb-6 text-lg">
                  Start your 7-day free trial now - no commitment required!
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition">
                    $14/month
                  </button>
                  <button className="bg-yellow-400 text-purple-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-300 transition">
                    $120/year - Save $48!
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setResult(null); setFile(null); setJob(''); }}
                className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition backdrop-blur-sm"
              >
                Analyze Another Resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
