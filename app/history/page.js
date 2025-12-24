'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Download, Copy, Calendar, BarChart, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function HistoryPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
    setLoading(false);
  };

  const downloadResumePDF = (optimizedResume, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(optimizedResume, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    const filename = `resume-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`;
    doc.save(filename);
  };

  const downloadAtsSafePDF = (atsSafeResume, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(atsSafeResume, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    const filename = `resume-ats-safe-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`;
    doc.save(filename);
  };

  const downloadCoverLetterPDF = (coverLetter, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(coverLetter, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    const filename = `cover-letter-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`;
    doc.save(filename);
  };

  const copyText = (text, itemId) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Please sign in to view history</div>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-7xl mx-auto p-6">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white mb-6 hover:text-purple-200"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-8">Resume History</h1>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-200 text-xl">No resume scans yet. Start by analyzing your first resume!</p>
              <button 
                onClick={() => router.push('/')}
                className="mt-6 bg-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-600"
              >
                Analyze Resume
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((scan) => (
                <div 
                  key={scan.id}
                  className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                  onClick={() => setSelectedScan(selectedScan?.id === scan.id ? null : scan)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{scan.job_title}</h3>
                      <div className="flex items-center gap-4 text-purple-200 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {formatDate(scan.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart size={16} />
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

                  {selectedScan?.id === scan.id && (
                    <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                      {/* Missing Keywords */}
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

                      {/* Optimized Resume */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-white">Optimized Resume</h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); copyText(scan.optimized_resume, `resume-${scan.id}`); }}
                              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                            >
                              {copiedItem === `resume-${scan.id}` ? (
                                <>
                                  <Check size={16} className="text-green-300" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={16} /> Copy
                                </>
                              )}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); downloadResumePDF(scan.optimized_resume, scan.job_title); }}
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

                      {/* ATS-Safe Resume (if exists) */}
                      {scan.ats_safe_resume && (
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400 rounded-xl p-6">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-1">🌐 ATS-Safe Resume (Accents Removed)</h4>
                              <p className="text-blue-200 text-sm">Special characters removed for maximum ATS compatibility</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyText(scan.ats_safe_resume, `ats-safe-${scan.id}`); }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                              >
                                {copiedItem === `ats-safe-${scan.id}` ? (
                                  <>
                                    <Check size={16} className="text-green-300" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={16} /> Copy
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); downloadAtsSafePDF(scan.ats_safe_resume, scan.job_title); }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                              >
                                <Download size={16} /> PDF
                              </button>
                            </div>
                          </div>
                          <pre className="bg-black/30 p-4 rounded-lg text-white text-sm whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                            {scan.ats_safe_resume}
                          </pre>
                          <div className="mt-3 bg-blue-500/30 border border-blue-400 rounded-lg p-3">
                            <p className="text-white text-sm">
                              <span className="font-semibold">💡 When to use:</span> Use the ATS-safe version when applying to international companies or positions with older ATS systems (especially Taleo). Use your original version for local companies.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cover Letter */}
                      {scan.cover_letter && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-semibold text-white">Cover Letter</h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyText(scan.cover_letter, `coverletter-${scan.id}`); }}
                                className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                              >
                                {copiedItem === `coverletter-${scan.id}` ? (
                                  <>
                                    <Check size={16} className="text-green-300" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={16} /> Copy
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); downloadCoverLetterPDF(scan.cover_letter, scan.job_title); }}
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
      </div>
    </div>
  );
}
