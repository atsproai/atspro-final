'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Download, Copy, Calendar, MessageCircle, Lightbulb, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function InterviewHistoryPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
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
      setInterviewHistory(data.interviewHistory || []);
    } catch (err) {
      console.error('Error fetching interview history:', err);
    }
    setLoading(false);
  };

  const downloadInterviewPDF = (questions, jobTitle) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Interview Prep Questions & Answers', margin, y);
    y += 10;

    // Job Title
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(jobTitle, margin, y);
    y += 10;

    // Date
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.setFontSize(10);
    doc.text(`Generated: ${date}`, margin, y);
    y += 15;

    // Loop through questions
    questions.forEach((q, index) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      // Question
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Question ${index + 1}:`, margin, y);
      y += 7;

      doc.setFont(undefined, 'normal');
      const questionLines = doc.splitTextToSize(q.question, maxLineWidth);
      questionLines.forEach(line => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 5;

      // Answer
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Answer:', margin, y);
      y += 7;

      doc.setFont(undefined, 'normal');
      const answerLines = doc.splitTextToSize(q.answer, maxLineWidth);
      answerLines.forEach(line => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 5;

      // Tip
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      const tipLines = doc.splitTextToSize(`Tip: ${q.tip}`, maxLineWidth);
      tipLines.forEach(line => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 10;

      if (index < questions.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    });

    const filename = `interview-prep-${jobTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`;
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
          <div className="text-white text-2xl mb-4">Please sign in to view interview history</div>
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
        <div className="text-white text-2xl">Loading interview history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-7xl mx-auto p-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-white mb-6 hover:text-purple-200"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="text-green-400" size={40} />
            <h1 className="text-4xl font-bold text-white">Interview Prep History</h1>
          </div>

          {interviewHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-200 text-xl mb-2">No interview prep sessions yet.</p>
              <p className="text-purple-300 mb-6">Generate your first personalized interview questions!</p>
              <button 
                onClick={() => router.push('/interview-prep')}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600"
              >
                Generate Interview Prep
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {interviewHistory.map((session) => (
                <div 
                  key={session.id}
                  className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg p-6 border-2 border-green-500/50 hover:border-green-400 transition cursor-pointer"
                  onClick={() => setSelectedInterview(selectedInterview?.id === session.id ? null : session)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{session.job_title}</h3>
                      <div className="flex items-center gap-4 text-green-200 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {formatDate(session.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {session.questions.length} Questions
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        downloadInterviewPDF(session.questions, session.job_title); 
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
                    >
                      <Download size={16} /> Download PDF
                    </button>
                  </div>

                  {selectedInterview?.id === session.id && (
                    <div className="mt-6 space-y-4 border-t border-green-400/30 pt-6">
                      {/* Job Description Preview */}
                      <div className="bg-black/20 rounded-lg p-4 border border-green-500/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">Job Description:</h4>
                        <p className="text-white text-sm line-clamp-3">{session.job_description}</p>
                      </div>

                      {/* Questions */}
                      {session.questions.map((q, index) => (
                        <div key={index} className="bg-black/20 rounded-lg p-5 border border-green-500/30">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-semibold text-lg mb-4">{q.question}</h4>
                              
                              {/* Answer */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-green-300 font-semibold text-sm">Suggested Answer:</h5>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      copyText(q.answer, `answer-${session.id}-${index}`); 
                                    }}
                                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                  >
                                    {copiedItem === `answer-${session.id}-${index}` ? (
                                      <>
                                        <Check size={12} /> Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} /> Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-white text-sm leading-relaxed bg-white/5 p-4 rounded">
                                  {q.answer}
                                </p>
                              </div>

                              {/* Tip */}
                              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                                  <div>
                                    <h6 className="text-yellow-300 font-semibold text-xs mb-1">Pro Tip:</h6>
                                    <p className="text-yellow-100 text-xs leading-relaxed">{q.tip}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
