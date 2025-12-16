'use client'
import React, { useState } from 'react';
import { Upload, CheckCircle, Users, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-800">
      <nav className="bg-black/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between">
          <div className="text-white text-2xl font-bold">ATSpro.ai</div>
          <div className="flex gap-4">
            <button onClick={() => setPage('home')} className="text-white">Home</button>
            <button onClick={() => setPage('analyzer')} className="text-white">Analyzer</button>
          </div>
        </div>
      </nav>

      {page === 'home' && (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-6xl font-bold text-white mb-6">Beat the ATS</h1>
          <p className="text-2xl text-purple-200 mb-8">AI fixes your resume</p>
          <button 
            onClick={() => setPage('analyzer')}
            className="bg-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-pink-600"
          >
            Try Free Now <ArrowRight className="inline ml-2" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-pink-300">94%</div>
              <div className="text-white">Success Rate</div>
            </div>
            <div className="bg-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-pink-300">50K+</div>
              <div className="text-white">Resumes Fixed</div>
            </div>
            <div className="bg-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-pink-300">$149</div>
              <div className="text-white">Lifetime Deal</div>
            </div>
          </div>
        </div>
      )}

      {page === 'analyzer' && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-white text-center mb-12">Resume Analyzer</h1>

          {!result ? (
            <div className="bg-white/10 rounded-2xl p-8">
              <div className="mb-8">
                <label className="block text-white text-xl mb-4">1. Upload Resume (PDF)</label>
                <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center hover:border-purple-300 transition">
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <input type="file" accept=".pdf" onChange={handleFile} className="hidden" id="upload" />
                  <label htmlFor="upload" className="cursor-pointer text-purple-300 text-lg">
                    {file ? <span className="text-green-400">✓ {file.name}</span> : 'Click to Upload'}
                  </label>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-white text-xl mb-4">2. Paste Job Description</label>
                <textarea
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Paste job description here..."
                  className="w-full h-48 p-4 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                onClick={analyze}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl text-xl font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/10 rounded-2xl p-8 text-center">
                <div className="text-6xl font-bold text-white mb-4">{result.score}%</div>
                <div className="text-2xl text-purple-200">ATS Score</div>
              </div>

              <div className="bg-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Missing Keywords</h2>
                <div className="flex flex-wrap gap-3">
                  {result.missingKeywords?.map((k, i) => (
                    <span key={i} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => { setResult(null); setFile(null); setJob(''); }} 
                className="w-full bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition"
              >
                Test Another Resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
