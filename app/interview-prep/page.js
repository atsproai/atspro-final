'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Copy, MessageCircle, Lightbulb, CheckCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function InterviewPrepPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedAnswer, setCopiedAnswer] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      alert('Please upload PDF only!');
    }
  };

  const generatePrep = async () => {
    if (!file || !jobDescription) {
      alert('Please upload resume and paste job description!');
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append('resume', file);
    form.append('jobDescription', jobDescription);

    try {
      const res = await fetch('/api/interview-prep', { method: 'POST', body: form });
      const data = await res.json();
      
      if (!res.ok) {
        alert('Error generating interview prep!');
        setLoading(false);
        return;
      }
      
      setQuestions(data.questions || []);
    } catch (err) {
      alert('Error generating prep!');
    }
    setLoading(false);
  };

  const copyAnswer = (answer, index) => {
    navigator.clipboard.writeText(answer);
    setCopiedAnswer(index);
    setTimeout(() => setCopiedAnswer(null), 2000);
  };

  const downloadInterviewPDF = () => {
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

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated: ${date}`, margin, y);
    y += 15;

    // Loop through questions
    questions.forEach((q, index) => {
      // Check if we need a new page
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      // Question number and text
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const questionHeader = `Question ${index + 1}:`;
      doc.text(questionHeader, margin, y);
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
      doc.text('Suggested Answer:', margin, y);
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

      // Pro Tip
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Pro Tip:', margin, y);
      y += 6;

      doc.setFont(undefined, 'italic');
      const tipLines = doc.splitTextToSize(q.tip, maxLineWidth);
      tipLines.forEach(line => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 10;

      // Separator line
      if (index < questions.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    });

    // Save the PDF
    doc.save('interview-prep-questions.pdf');
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Please sign in to use Interview Prep</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-5xl mx-auto p-6">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white mb-6 hover:text-purple-200"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="text-green-400" size={40} />
            <h1 className="text-4xl font-bold text-white">Interview Prep Assistant</h1>
          </div>
          <p className="text-purple-200 mb-8">Get personalized interview questions and answers based on your experience</p>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Upload Your Resume (PDF)</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFile} 
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the job description here..."
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
          </div>

          <button
            onClick={generatePrep}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition disabled:opacity-50 text-lg"
          >
            {loading ? 'Generating Interview Prep...' : '🎯 Generate Interview Questions'}
          </button>
        </div>

        {questions.length > 0 && (
          <>
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    ✅ {questions.length} Questions Ready!
                  </h3>
                  <p className="text-green-100">
                    Click each question to see your personalized answer and tips
                  </p>
                </div>
                <button
                  onClick={downloadInterviewPDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition ml-4"
                >
                  <Download size={20} /> Download PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
                >
                  <div 
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="p-6 cursor-pointer hover:bg-white/5 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{q.question}</h3>
                        <p className="text-purple-300 text-sm">
                          {expandedIndex === index ? 'Click to collapse' : 'Click to see answer & tips'}
                        </p>
                      </div>
                      <div className={`text-white transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {expandedIndex === index && (
                    <div className="border-t border-white/20 p-6 bg-black/20">
                      {/* Answer */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={20} />
                            <h4 className="text-lg font-semibold text-white">Suggested Answer</h4>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyAnswer(q.answer, index); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                              copiedAnswer === index 
                                ? 'bg-green-600 text-white' 
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {copiedAnswer === index ? (
                              <>
                                <CheckCircle size={16} /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={16} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <p className="text-white leading-relaxed">{q.answer}</p>
                        </div>
                      </div>

                      {/* Tip */}
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
          </>
        )}
      </div>
    </div>
  );
}
