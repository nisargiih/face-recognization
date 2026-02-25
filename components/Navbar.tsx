'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, LogOut, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">NEXUS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Features</Link>
            <Link href="/#contact" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Contact</Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={() => logout()}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Login</Link>
                <Link href="/register" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-black/5 px-4 pt-2 pb-6 space-y-4"
          >
            <Link href="/#features" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-600">Features</Link>
            <Link href="/#contact" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-600">Contact</Link>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-600">Dashboard</Link>
                <button onClick={() => { logout(); setIsOpen(false); }} className="block text-base font-medium text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-600">Login</Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="block bg-black text-white text-center py-3 rounded-xl font-medium">Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
