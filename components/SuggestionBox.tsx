'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MessageSquare, Send, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Suggestion {
  _id: string;
  content: string;
  status: 'pending' | 'reviewed' | 'implemented';
  createdAt: string;
}

export default function SuggestionBox() {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions');
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions');
    } finally {
      setFetching(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSuggestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        toast.success('Suggestion submitted!');
        setContent('');
        fetchSuggestions();
      } else {
        toast.error('Failed to submit suggestion.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'reviewed': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Submit a Suggestion</span>
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            required
            placeholder="What can we improve?"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            disabled={loading}
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Submit</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Your Suggestions</h3>
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-black/10">
            <p className="text-gray-400">No suggestions yet. Share your thoughts!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {suggestions.map((s) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-black/5 flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium">{s.content}</p>
                    <p className="text-xs text-gray-400">
                      {mounted ? new Date(s.createdAt).toLocaleDateString() : '...'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-50 border border-black/5">
                    {getStatusIcon(s.status)}
                    <span className="text-xs font-bold uppercase tracking-tighter text-gray-500">{s.status}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
