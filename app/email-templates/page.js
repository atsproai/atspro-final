'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Copy, Mail, Send, Sparkles, Download, Loader2, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [emailType, setEmailType] = useState('follow-up');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [resumeContext, setResumeContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const generateEmail = async () => {
    if (!jobTitle || !companyName || !resumeContext) {
      alert('Please fill in all fields!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          jobTitle,
          companyName,
          optimizedResume: resumeContext
        }),
      });
      const data = await res.json();
      setGeneratedEmail(data.emailContent);
    } catch (err) {
      alert('Error generating email!');
    }
    setLoading(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const downloadEmailPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const lines = doc.splitTextToSize(generatedEmail, maxLineWidth);
    
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    const filename = `${emailType}-email-${companyName.replace(/[^a-z0-9]/gi, '-')}.pdf`;
    doc.save(filename);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Please sign in to use Email Templates</div>
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

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="text-pink-500" size={40} />
            <h1 className="text-4xl font-bold text-white">Email Templates</h1>
          </div>
          <p className="text-purple-200 mb-8">Generate professional emails for your job search instantly</p>

          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-white mb-3 font-semibold">Email Type</label>
            <div className="grid md:grid-cols-3 gap-4">
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

          {/* Input Fields */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white mb-2 font-semibold">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-semibold">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Your Background (Brief Summary)</label>
            <textarea
              value={resumeContext}
              onChange={(e) => setResumeContext(e.target.value)}
              rows={4}
              placeholder="Paste a brief summary of your experience or key skills relevant to this position..."
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
          </div>

          <button
            onClick={generateEmail}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating...
              </>
            ) : (
              '✨ Generate Email'
            )}
          </button>

          {/* Generated Email */}
          {generatedEmail && (
            <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">Your Email</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyEmail}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    {copiedEmail ? (
                      <>
                        <Check size={18} className="text-green-300" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} /> Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={downloadEmailPDF}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} /> PDF
                  </button>
                </div>
              </div>
              <div className="bg-black/30 p-6 rounded-lg">
                <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">
                  {generatedEmail}
                </pre>
              </div>
              <p className="text-purple-300 text-sm mt-4">
                💡 Tip: Add your own subject line and greeting (e.g., "Dear [Name],") before sending!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
