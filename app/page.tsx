'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';
import SubscribeForm from '@/components/SubscribeForm';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, FolderUp, Search, Users, Zap, ShieldCheck, Link as LinkIcon, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans selection:bg-black selection:text-white">
      <Navbar />

      {/* Hero Section - Split Layout Inspiration */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Privacy-First AI</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                  Upload Once. <br />
                  Find Anyone. <br />
                  <span className="text-gray-400 italic font-serif">Instantly.</span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
                  Our AI automatically groups and searches photos by face — no manual sorting needed. 
                  <span className="block mt-4 p-4 bg-white border border-black/5 rounded-2xl text-sm font-medium text-black flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-emerald-500" />
                    <span>We do not store any of your photos in our system. Your privacy is our priority.</span>
                  </span>
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/register" className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10">
                    <span>Start Organizing Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto bg-white text-black border border-black/5 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
                    Try Face Search Free
                  </Link>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white"
              >
                <Image
                  src="https://picsum.photos/800/1000"
                  alt="Nexus Face Recognition Dashboard"
                  width={800}
                  height={1000}
                  className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              {/* Decorative background elements */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Brutalist Inspiration */}
      <section className="py-32 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-6">
                How It <br />Works.
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Three simple steps to organize thousands of photos in seconds.
              </p>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                <div className="flex items-center space-x-3 text-emerald-700 font-bold mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Privacy Guaranteed</span>
                </div>
                <p className="text-sm text-emerald-600 leading-relaxed">
                  Your photos never leave your device. We process everything locally and only store mathematical face signatures.
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: FolderUp, title: 'Upload & Import', desc: 'Select a folder from your PC or paste a public Google Drive link to begin.' },
                { step: '02', icon: Users, title: 'AI Detection', desc: 'Our advanced AI scans your images to detect and group faces automatically.' },
                { step: '03', icon: Search, title: 'Face Search', desc: 'Upload a single photo to find every match across your entire library instantly.' },
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-[#f9f9f9] border border-black/5 group hover:bg-black hover:text-white transition-all duration-500">
                  <span className="absolute top-6 right-8 text-4xl font-serif italic opacity-10 group-hover:opacity-20 transition-opacity">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center mb-6 shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm opacity-60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean Utility Inspiration */}
      <section id="features" className="py-32 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Powerful AI Features.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Built for speed, accuracy, and total privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FolderUp, title: 'Bulk Folder Upload', desc: 'Process entire directories of images directly from your local machine.' },
              { icon: LinkIcon, title: 'Google Drive Import', desc: 'Fetch images from public Google Drive folders with a single link.' },
              { icon: Users, title: 'Automatic Clustering', desc: 'Faces are grouped into Person IDs automatically using vector embeddings.' },
              { icon: Search, title: 'Smart Face Search', desc: 'Find anyone in your library by simply uploading their photo.' },
              { icon: Zap, title: 'High Accuracy', desc: 'State-of-the-art face matching with similarity confidence scores.' },
              { icon: ShieldCheck, title: 'Privacy First', desc: 'We process your images and store only embeddings. Your photos stay yours.' },
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-black/5 hover:border-black/10 transition-all group shadow-sm hover:shadow-xl hover:shadow-black/5">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 border border-black/5 group-hover:bg-black group-hover:text-white transition-all">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases - Warm Organic Inspiration */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Trusted by Professionals</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {['Wedding Photographers', 'Event Organizers', 'Schools', 'Corporate HR', 'Media Agencies'].map((useCase, i) => (
              <span key={i} className="px-8 py-4 bg-gray-50 border border-black/5 rounded-full text-sm font-bold text-gray-600 hover:bg-black hover:text-white transition-all cursor-default">
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-8">Get in <br />touch.</h2>
              <p className="text-gray-500 text-xl mb-12 leading-relaxed">
                Have questions about our face recognition technology? We&apos;re here to help you organize your memories.
              </p>
              <div className="grid grid-cols-2 gap-12">
                {[
                  { label: 'General', value: 'hello@nexusface.com' },
                  { label: 'Privacy', value: 'privacy@nexusface.com' },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{item.label}</p>
                    <p className="text-lg font-medium border-b border-black/10 pb-2">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {mounted ? <ContactForm /> : <div className="h-[400px] bg-white rounded-3xl animate-pulse" />}
              {/* Decorative element */}
              <div className="absolute -z-10 -bottom-10 -right-10 w-40 h-40 bg-black/5 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Stay in the loop.</h2>
          <p className="text-gray-400 text-xl mb-12 max-w-xl mx-auto">
            Subscribe for updates on our AI models and privacy features.
          </p>
          {mounted ? <SubscribeForm /> : <div className="h-12 w-full max-w-md mx-auto bg-white/10 rounded-xl animate-pulse" />}
        </div>
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
