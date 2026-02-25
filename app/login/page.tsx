'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';
import { Chrome } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Welcome back!');
        login(data.user);
      } else {
        toast.error(data.error || 'Login failed.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          toast.success('Logged in with Google!');
          window.location.href = '/dashboard';
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (error) {
      toast.error('Google login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block font-bold text-3xl tracking-tighter mb-4">NEXUS</Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-500">Enter your credentials to access your account</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Password</label>
                <Link href="#" className="text-xs font-bold text-gray-400 hover:text-black transition-colors">Forgot?</Link>
              </div>
              <input
                required
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black border border-black/10 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all"
          >
            <Chrome className="w-5 h-5" />
            <span>Google</span>
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don&apos;t have an account? <Link href="/register" className="font-bold text-black hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
