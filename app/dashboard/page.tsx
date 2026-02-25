'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaceOrganizer from '@/components/FaceOrganizer';
import { motion } from 'motion/react';
import { Layout, MessageSquare, Settings, User as UserIcon, Zap, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="text-gray-500">Manage your photo library and find anyone instantly.</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-sm font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy Mode Active</span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Library Stats</p>
                  <p className="text-3xl font-bold mb-6">Pro Member</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">People</p>
                      <p className="text-xl font-bold">--</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Photos</p>
                      <p className="text-xl font-bold">--</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Quick Actions</h3>
                <div className="grid gap-2">
                  {[
                    { icon: UserIcon, label: 'Profile Settings' },
                    { icon: Settings, label: 'Preferences' },
                    { icon: Layout, label: 'Billing' },
                  ].map((item, i) => (
                    <button key={i} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-all">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <FaceOrganizer />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
