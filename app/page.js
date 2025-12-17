'use client';
import React, { useState } from 'react';
import { Upload, CheckCircle, Users, ArrowRight, Copy, Download } from 'lucide-react';
import jsPDF from 'jspdf';

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
      alert('Error analyzing!');
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5;
    };

    // Title
    addText('AI-Optimized Resume', 16, true);
    yPosition += 5;

    // Parse and format the result text
    const sections = result.optimizedResume.split('\n\n');
    sections.forEach(section => {
      if (section.trim()) {
        addText(section.trim());
        yPosition += 3;
      }
    });

    doc.save('optimized-resume.pdf');
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
          <div className="space-x-6">
            <button onClick={() => setPage('home')} className="text-white hover:text-purple-200">Home</button>
            <button onClick={() => setPage('analyzer')} className="text-white hover:text-purple-200">Analyzer</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">Beat the ATS.<br/>Land the Interview.</h2>
            <p className="text-xl text-purple-200 mb-8">AI-powered resume optimization that gets past automated screening</p>
            <button onClick={() => setPage('analyzer')} className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-100 transition inline-flex items-center gap-2">
              Get Started Free <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <Upload className="text-purple-300 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-white mb-3">Upload Resume</h3>
              <p className="text-purple-200">Drop your current resume and job description</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <CheckCircle className="text-purple-300 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-white mb-3">AI Analysis</h3>
              <p className="text-purple-200">Our AI matches keywords and formats perfectly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
              <Users className="text-purple-300 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-white mb-3">Get Interviews</h3>
              <p className="text-purple-200">Download your ATS-optimized resume</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white">ATSpro.ai</h1>
        <div className="space-x-6">
          <button onClick={() => setPage('home')} className="text-white hover:text-purple-200">Home</button>
          <button onClick={() => setPage('analyzer')} className="text-white hover:text-purple-200">Analyzer</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
          <h2 className="text-3xl font-bold text-white mb-6">Resume Analyzer</h2>
          
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Upload Resume (PDF)</label>
            <input type="file" accept=".pdf" onChange={handleFile} className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30" />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Job Description</label>
            <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={6} placeholder="Paste the job description here..." className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-200" />
          </div>

          <button onClick={analyze} disabled={loading} className="w-full bg-white text-purple-900 py-3 rounded-lg font-semibold hover:bg-purple-100 transition disabled:opacity-50">
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
                  <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <Download size={18} /> Download PDF
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
