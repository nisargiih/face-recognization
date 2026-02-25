'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FolderUp, Link as LinkIcon, Search, Users, Loader2, Image as ImageIcon, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFaceEmbeddings, calculateDistance } from '@/lib/face-recognition';
import { set, get, keys, del } from 'idb-keyval';

interface Person {
  _id: string;
  personId: string;
  name: string;
  thumbnailUrl: string;
}

interface FaceEmbedding {
  _id: string;
  personId: string;
  embedding: number[];
  imageUrl: string;
  source: 'local' | 'gdrive';
}

export default function FaceOrganizer() {
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'people'>('upload');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [embeddings, setEmbeddings] = useState<FaceEmbedding[]>([]);
  const [searchResults, setSearchResults] = useState<{ embedding: FaceEmbedding; score: number }[]>([]);
  const [searchImage, setSearchImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch('/api/persons'),
        fetch('/api/embeddings')
      ]);
      if (pRes.ok) setPeople(await pRes.json());
      if (eRes.ok) setEmbeddings(await eRes.json());
    } catch (error) {
      console.error('Failed to fetch data');
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    const total = files.length;
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const imageUrl = await readFileAsDataURL(file);
        const img = await loadImage(imageUrl);
        const faces = await getFaceEmbeddings(img);

        for (const face of faces) {
          // Find matching person
          let matchedPersonId = `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          let bestMatch = null;
          let minDistance = 0.6; // Threshold

          for (const existing of embeddings) {
            const dist = calculateDistance(face.embedding, existing.embedding);
            if (dist < minDistance) {
              minDistance = dist;
              bestMatch = existing;
            }
          }

          if (bestMatch) {
            matchedPersonId = bestMatch.personId;
          } else {
            // Create new person
            await fetch('/api/persons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                personId: matchedPersonId,
                name: 'Unknown Person',
                thumbnailUrl: imageUrl,
              }),
            });
          }

          // Store image in IndexedDB
          const imageKey = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await set(imageKey, imageUrl);

          // Store embedding
          await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personId: matchedPersonId,
              embedding: face.embedding,
              imageUrl: imageKey,
              source: 'local',
            }),
          });
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }

      processed++;
      setProgress(Math.round((processed / total) * 100));
    }

    setProcessing(false);
    toast.success('Folder processed successfully!');
    fetchData();
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      const imageUrl = await readFileAsDataURL(file);
      setSearchImage(imageUrl);
      const img = await loadImage(imageUrl);
      const faces = await getFaceEmbeddings(img);

      if (faces.length === 0) {
        toast.error('No faces detected in the photo.');
        setProcessing(false);
        return;
      }

      const results: { embedding: FaceEmbedding; score: number }[] = [];
      for (const face of faces) {
        for (const existing of embeddings) {
          const dist = calculateDistance(face.embedding, existing.embedding);
          if (dist < 0.6) {
            results.push({ embedding: existing, score: 1 - dist });
          }
        }
      }

      setSearchResults(results.sort((a, b) => b.score - a.score));
      setActiveTab('search');
    } catch (error) {
      toast.error('Search failed.');
    } finally {
      setProcessing(false);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  useEffect(() => {
    const loadLocalImages = async () => {
      const imgKeys = await keys();
      const images: Record<string, string> = {};
      for (const key of imgKeys) {
        if (typeof key === 'string' && key.startsWith('img_')) {
          images[key] = await get(key);
        }
      }
      setLocalImages(images);
    };
    loadLocalImages();
  }, [embeddings]);

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'upload', icon: FolderUp, label: 'Upload' },
          { id: 'people', icon: Users, label: 'People' },
          { id: 'search', icon: Search, label: 'Search' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Folder Upload */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-black/10 hover:border-black/20 transition-all cursor-pointer text-center group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFolderUpload}
                  className="hidden"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                />
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FolderUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload Folder</h3>
                <p className="text-gray-400 text-sm">Select a folder from your PC to process all images.</p>
              </div>

              {/* GDrive Link */}
              <div className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-sm text-center flex flex-col justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Google Drive Link</h3>
                <p className="text-gray-400 text-sm mb-6">Import images from a public Google Drive folder.</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Paste public link here..."
                    className="flex-1 px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={gdriveUrl}
                    onChange={(e) => setGdriveUrl(e.target.value)}
                  />
                  <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all">
                    Import
                  </button>
                </div>
              </div>
            </div>

            {processing && (
              <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    <span className="font-bold">Processing Images...</span>
                  </div>
                  <span className="text-sm font-bold text-gray-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-black h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start space-x-4">
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900">Privacy Notice</h4>
                <p className="text-sm text-amber-800">
                  We do not store your original photos on our servers. Images uploaded from your PC are stored locally in your browser&apos;s IndexedDB. Only face embeddings (mathematical representations) are stored in our database to enable cross-device search.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'people' && (
          <motion.div
            key="people"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {people.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-black/10">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400">No people detected yet. Upload some photos!</p>
              </div>
            ) : (
              people.map((person) => (
                <div key={person._id} className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm group hover:scale-[1.02] transition-all cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100 relative">
                    <img
                      src={person.thumbnailUrl}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">View Photos</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-center truncate">{person.name}</h4>
                  <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-1">
                    {embeddings.filter(e => e.personId === person.personId).length} Photos
                  </p>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              <div 
                onClick={() => document.getElementById('search-input')?.click()}
                className="w-32 h-32 rounded-3xl border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group"
              >
                {searchImage ? (
                  <img src={searchImage} alt="Search reference" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                </div>
                <input id="search-input" type="file" className="hidden" onChange={handleSearch} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Search by Photo</h3>
                <p className="text-gray-500">Upload a photo to find all matching images in your library.</p>
              </div>
              <button 
                onClick={() => document.getElementById('search-input')?.click()}
                className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Upload Photo</span>
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Search Results</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.map((result, i) => (
                    <div key={i} className="bg-white p-2 rounded-2xl border border-black/5 shadow-sm relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={localImages[result.embedding.imageUrl] || 'https://picsum.photos/200'}
                          alt={`Match ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                        {Math.round(result.score * 100)}% Match
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
