'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SubscribeForm() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Subscribed successfully!');
        setEmail('');
      } else {
        toast.error(data.error || 'Subscription failed.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="h-12 w-full max-w-md mx-auto bg-white/10 rounded-xl animate-pulse" />;

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        required
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        disabled={loading}
        type="submit"
        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50"
      >
        {loading ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}
