'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-black/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">NEXUS</span>
            </Link>
            <p className="text-gray-500 max-w-xs">
              Empowering developers and teams to build the future of the web with speed and precision.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">Product</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link href="/#features" className="hover:text-black transition-colors">Features</Link></li>
              <li><Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link></li>
              <li><Link href="/register" className="hover:text-black transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">Company</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link href="/#contact" className="hover:text-black transition-colors">Contact</Link></li>
              <li><Link href="/" className="hover:text-black transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2026 Nexus Platform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-black transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-black transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-black transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
