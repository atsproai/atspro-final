'use client';
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function FeedbackWidget() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          user_email: user?.primaryEmailAddress?.emailAddress || ''
        })
      });

      if (res.ok) {
        alert('Feedback submitted! Thank you!');
        setMessage('');
        setIsOpen(false);
      } else {
        alert('Failed to submit feedback');
      }
    } catch (err) {
      alert('Error submitting feedback');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
        aria-label="Send Feedback"
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div 
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-t-3xl md:rounded-2xl w-full md:max-w-md border-2 border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-bold text-white">Send Feedback</h3>
                <p className="text-purple-200 text-sm mt-1">Help us improve ATSpro!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white mb-2 font-semibold">Feedback Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setType('bug')}
                    className={`p-3 rounded-lg border-2 transition ${
                      type === 'bug'
                        ? 'bg-red-600 border-red-400 text-white'
                        : 'bg-white/5 border-white/20 text-purple-200 hover:border-red-400'
                    }`}
                  >
                    🐛 Bug
                  </button>
                  <button
                    onClick={() => setType('feature')}
                    className={`p-3 rounded-lg border-2 transition ${
                      type === 'feature'
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-white/5 border-white/20 text-purple-200 hover:border-blue-400'
                    }`}
                  >
                    💡 Feature
                  </button>
                  <button
                    onClick={() => setType('other')}
                    className={`p-3 rounded-lg border-2 transition ${
                      type === 'other'
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-white/5 border-white/20 text-purple-200 hover:border-purple-400'
                    }`}
                  >
                    💬 Other
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/30 placeholder-purple-300 focus:border-pink-500 focus:outline-none"
                  maxLength={2000}
                />
                <p className="text-purple-300 text-xs mt-1">{message.length}/2000 characters</p>
              </div>

              <button
                onClick={submitFeedback}
                disabled={loading || !message.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={18} />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
