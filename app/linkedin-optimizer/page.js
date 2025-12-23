'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Copy, Linkedin, Sparkles, Briefcase, Loader2, Check } from 'lucide-react';

export default function LinkedInOptimizerPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      alert('Please upload PDF only!');
    }
  };

  const optimize = async () => {
    if (!file) {
      alert('Please upload your resume!');
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append('resume', file);
    form.append('targetRole', targetRole);

    try {
      const res = await fetch('/api/linkedin-optimizer', { method: 'POST', body: form });
      const data = await res.json();
      
      if (!res.ok) {
        alert('Error optimizing LinkedIn profile!');
        setLoading(false);
        return;
      }
      
      setResult(data);
    } catch (err) {
      alert('Error optimizing!');
    }
    setLoading(false);
  };

  const copyText = (text, itemId) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Please sign in to use LinkedIn Optimizer</div>
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
            <Linkedin className="text-blue-400" size={40} />
            <h1 className="text-4xl font-bold text-white">LinkedIn Profile Optimizer</h1>
          </div>
          <p className="text-purple-200 mb-8">Transform your resume into a compelling LinkedIn profile</p>

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
            <label className="block text-white mb-2 font-semibold">Target Role (Optional)</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Product Manager"
              className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 placeholder-purple-300"
            />
            <p className="text-purple-300 text-sm mt-2">Leave blank to optimize based on your current experience</p>
          </div>

          <button
            onClick={optimize}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Optimizing...
              </>
            ) : (
              '✨ Optimize LinkedIn Profile'
            )}
          </button>
        </div>

        {result && (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={24} />
                  <h3 className="text-2xl font-bold text-white">LinkedIn Headline</h3>
                </div>
                <button
                  onClick={() => copyText(result.headline, 'headline')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {copiedItem === 'headline' ? (
                    <>
                      <Check size={18} className="text-green-300" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/30 p-6 rounded-lg">
                <p className="text-white text-lg leading-relaxed">{result.headline}</p>
              </div>
              <p className="text-purple-300 text-sm mt-2">💡 Max 220 characters - Perfect for LinkedIn!</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={24} />
                  <h3 className="text-2xl font-bold text-white">About Section</h3>
                </div>
                <button
                  onClick={() => copyText(result.about, 'about')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {copiedItem === 'about' ? (
                    <>
                      <Check size={18} className="text-green-300" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/30 p-6 rounded-lg">
                <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">{result.about}</pre>
              </div>
            </div>

            {result.experiences && result.experiences.map((exp, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-green-400" size={24} />
                    <div>
                      <h3 className="text-2xl font-bold text-white">{exp.title}</h3>
                      <p className="text-purple-300">{exp.company}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyText(exp.description, `exp-${index}`)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {copiedItem === `exp-${index}` ? (
                      <>
                        <Check size={18} className="text-green-300" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/30 p-6 rounded-lg">
                  <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">{exp.description}</pre>
                </div>
              </div>
            ))}

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center">
              <p className="text-blue-100 text-lg">
                🎉 Your LinkedIn profile is ready! Copy each section and paste directly into LinkedIn.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
