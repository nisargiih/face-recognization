'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FolderUp, Link as LinkIcon, Search, Users, Loader2, Image as ImageIcon, X, CheckCircle2, AlertCircle, ShieldCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFaceEmbeddings, calculateDistance } from '@/lib/face-recognition';
import { set, get, keys, clear } from 'idb-keyval';

interface Person {
  _id: string;
  personId: string;
  name: string;
  thumbnailUrl: string;
  centroid?: number[];
  photoCount?: number;
}

interface FaceEmbedding {
  _id: string;
  personId: string;
  embedding: number[];
  imageUrl: string;
  source: 'local' | 'gdrive';
}

function LazyImage({ imageKey, fallback, className, alt }: { imageKey: string; fallback: string; className?: string; alt?: string }) {
  const [src, setSrc] = useState<string | null>(() => {
    if (!imageKey) return fallback;
    if (imageKey.startsWith('data:')) return imageKey;
    return null;
  });

  useEffect(() => {
    if (!imageKey || imageKey.startsWith('data:')) return;
    
    get(imageKey).then((val) => {
      setSrc(val || fallback);
    }).catch(() => {
      setSrc(fallback);
    });
  }, [imageKey, fallback]);

  if (!src) return <div className={`${className} bg-gray-100 animate-pulse`} />;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}

export default function FaceOrganizer() {
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'people'>('upload');
  const [initialLoading, setInitialLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [embeddings, setEmbeddings] = useState<FaceEmbedding[]>([]);
  const [searchResults, setSearchResults] = useState<{ embedding: FaceEmbedding; score: number; confidence: 'High' | 'Medium' | 'Low' }[]>([]);
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await Promise.all([fetchData(currentPage), loadLocalImages()]);
      setInitialLoading(false);
    };
    init();
  }, [currentPage]);

  const fetchData = async (page = 1) => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`/api/persons?page=${page}&limit=24`),
        fetch('/api/embeddings')
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setPeople(data.people);
        setTotalPages(data.totalPages);
        setTotalPeople(data.total);
      }
      if (eRes.ok) setEmbeddings(await eRes.json());
    } catch (error) {
      console.error('Failed to fetch data');
    }
  };

  const loadLocalImages = async () => {
    // We don't need to load all images into memory anymore.
    // We will fetch them on-demand in the UI components.
    setLocalImages({});
  };

  const resizeImage = (url: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
      };
      img.src = url;
    });
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    const total = files.length;
    let processed = 0;

    // Fetch latest data to ensure we have the most up-to-date state for clustering
    const [pRes, eRes] = await Promise.all([
      fetch('/api/persons'),
      fetch('/api/embeddings')
    ]);
    const currentPeople: Person[] = pRes.ok ? await pRes.json() : [];
    const currentEmbeddings: FaceEmbedding[] = eRes.ok ? await eRes.json() : [];

    const sessionPeople = [...currentPeople];
    const sessionEmbeddings = [...currentEmbeddings];

    // 1. Collect all faces from all files in the batch
    const batchFaces: { embedding: number[]; thumbnail: string; imageKey: string }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const rawImageUrl = await readFileAsDataURL(file);
        const optimizedImageUrl = await resizeImage(rawImageUrl, 800, 800);
        const img = await loadImage(optimizedImageUrl);
        const faces = await getFaceEmbeddings(img);

        if (faces.length > 0) {
          const imageKey = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await set(imageKey, optimizedImageUrl);
          
          for (const face of faces) {
            batchFaces.push({
              embedding: face.embedding,
              thumbnail: face.thumbnail,
              imageKey
            });
          }
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
      processed++;
      setProgress(Math.round((processed / total) * 0.5)); // First 50% is extraction
    }

    // 2. Cluster the batch faces
    // We use a simple clustering algorithm: 
    // For each face, find if it matches an existing person or another face in the batch
    const clusters: { personId: string; faces: typeof batchFaces }[] = [];

    for (const face of batchFaces) {
      let matchedCluster = null;
      let minDistance = 0.55; // Slightly stricter for batch clustering

      // Check existing people first
      for (const person of sessionPeople) {
        if (!person.centroid) continue;
        const dist = calculateDistance(face.embedding, person.centroid);
        if (dist < minDistance) {
          minDistance = dist;
          matchedCluster = { personId: person.personId, isNew: false };
        }
      }

      // If no person match, check clusters created in this batch
      if (!matchedCluster) {
        for (const cluster of clusters) {
          // Compare against the first face of the cluster (representative)
          const dist = calculateDistance(face.embedding, cluster.faces[0].embedding);
          if (dist < 0.5) { // Stricter for intra-batch clustering
            matchedCluster = { personId: cluster.personId, isNew: true, cluster };
            break;
          }
        }
      }

      if (matchedCluster) {
        if (matchedCluster.cluster) {
          matchedCluster.cluster.faces.push(face);
        } else {
          // It matched an existing person, but we need a cluster to hold it for this batch
          let existingCluster = clusters.find(c => c.personId === matchedCluster.personId);
          if (existingCluster) {
            existingCluster.faces.push(face);
          } else {
            clusters.push({ personId: matchedCluster.personId, faces: [face] });
          }
        }
      } else {
        // Create a new cluster/person
        const newPersonId = `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        clusters.push({ personId: newPersonId, faces: [face] });
      }
    }

    // 3. Save clusters to DB
    processed = 0;
    const totalClusters = clusters.length;

    for (const cluster of clusters) {
      const isExisting = sessionPeople.some(p => p.personId === cluster.personId);
      
      if (!isExisting) {
        // Create new person
        const pPostRes = await fetch('/api/persons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId: cluster.personId,
            name: 'Unknown Person',
            thumbnailUrl: cluster.faces[0].thumbnail,
          }),
        });
        if (pPostRes.ok) {
          const newPerson = await pPostRes.json();
          sessionPeople.push(newPerson);
        }
      }

      // Save all embeddings for this cluster
      for (const face of cluster.faces) {
        await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId: cluster.personId,
            embedding: face.embedding,
            imageUrl: face.imageKey,
            source: 'local',
          }),
        });
      }
      
      processed++;
      setProgress(50 + Math.round((processed / totalClusters) * 50));
    }

    setProcessing(false);
    toast.success('Folder processed successfully!');
    fetchData();
    loadLocalImages();
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

      const personMatches: Record<string, { embedding: FaceEmbedding; score: number; confidence: 'High' | 'Medium' | 'Low' }> = {};
      
      for (const face of faces) {
        // Stage 1: Filter people using centroids (Vector Indexing Technique)
        const candidatePeople = people.filter(p => {
          if (!p.centroid) return true; // Fallback for people without centroids
          const dist = calculateDistance(face.embedding, p.centroid);
          return dist < 0.75; // Broad filter to catch potential matches
        });

        // Stage 2: Detailed comparison against candidate embeddings
        const candidatePersonIds = new Set(candidatePeople.map(p => p.personId));
        const filteredEmbeddings = embeddings.filter(e => candidatePersonIds.has(e.personId));

        for (const existing of filteredEmbeddings) {
          const dist = calculateDistance(face.embedding, existing.embedding);
          
          // Refined threshold logic with confidence levels
          if (dist < 0.6) {
            const score = 1 - dist;
            let confidence: 'High' | 'Medium' | 'Low' = 'Low';
            
            if (dist < 0.4) confidence = 'High';
            else if (dist < 0.5) confidence = 'Medium';

            // Only keep the best match per person
            if (!personMatches[existing.personId] || score > personMatches[existing.personId].score) {
              personMatches[existing.personId] = { embedding: existing, score, confidence };
            }
          }
        }
      }

      setSearchResults(Object.values(personMatches).sort((a, b) => b.score - a.score));
      setActiveTab('search');
    } catch (error) {
      toast.error('Search failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all data? This will remove all photos from your browser and all people from your library.')) {
      try {
        await Promise.all([
          clear(),
          fetch('/api/persons', { method: 'DELETE' })
        ]);
        setLocalImages({});
        setPeople([]);
        setEmbeddings([]);
        setSelectedPerson(null);
        toast.success('All data cleared.');
      } catch (error) {
        toast.error('Failed to clear data.');
      }
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (confirm('Are you sure you want to delete this person and all their photos?')) {
      try {
        const res = await fetch(`/api/persons?personId=${personId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Person deleted.');
          setSelectedPerson(null);
          fetchData(currentPage);
        }
      } catch (error) {
        toast.error('Failed to delete person.');
      }
    }
  };

  const handleRenamePerson = async () => {
    if (!selectedPerson || !newName.trim()) return;
    try {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPerson.personId,
          name: newName.trim(),
          thumbnailUrl: selectedPerson.thumbnailUrl
        }),
      });
      if (res.ok) {
        toast.success('Person renamed.');
        setIsRenaming(false);
        const updatedPerson = await res.json();
        setSelectedPerson(updatedPerson);
        fetchData(currentPage);
      }
    } catch (error) {
      toast.error('Failed to rename person.');
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

  return (
    <div className="space-y-8">
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-black" />
          <p className="text-gray-500 font-medium animate-pulse">Initializing Face Organizer...</p>
        </div>
      ) : (
        <>
          {/* Tabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        
        <button 
          onClick={handleClearCache}
          className="flex items-center space-x-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-4 py-2 rounded-xl bg-red-50 border border-red-100"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear Local Cache</span>
        </button>
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
                <h4 className="font-bold text-amber-900">Privacy & Storage</h4>
                <p className="text-sm text-amber-800">
                  We do not store your original photos on our servers. Images are optimized and stored locally in your browser&apos;s IndexedDB. 
                  <span className="block mt-1 font-semibold">Note: Local storage is limited. If you see errors, try clearing your cache.</span>
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
            className="space-y-6"
          >
            {selectedPerson ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => {
                        setSelectedPerson(null);
                        setIsRenaming(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <LazyImage
                        imageKey={selectedPerson.thumbnailUrl}
                        fallback=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      {isRenaming ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-black/5 outline-none font-bold text-xl"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleRenamePerson()}
                          />
                          <button 
                            onClick={handleRenamePerson}
                            className="p-1.5 bg-black text-white rounded-lg hover:bg-gray-800"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <h3 className="text-2xl font-bold">{selectedPerson.name}</h3>
                          <button 
                            onClick={() => {
                              setIsRenaming(true);
                              setNewName(selectedPerson.name);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-md"
                          >
                            <FolderUp className="w-4 h-4 rotate-90" /> {/* Using as edit icon */}
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 font-medium">{selectedPerson.photoCount || 0} Photos in Library</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePerson(selectedPerson.personId)}
                    className="flex items-center space-x-2 text-red-500 hover:text-red-600 font-bold text-sm px-4 py-2 rounded-xl bg-red-50 border border-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {embeddings
                    .filter(e => e.personId === selectedPerson.personId)
                    .map((emb, i) => (
                      <div key={emb._id} className="bg-white p-2 rounded-2xl border border-black/5 shadow-sm group relative">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <LazyImage
                            imageKey={emb.imageUrl}
                            fallback=""
                            className="w-full h-full object-cover"
                            alt={`Photo ${i}`}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8">
                  {people.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-black/10">
                      <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400">No people detected yet. Upload some photos!</p>
                    </div>
                  ) : (
                    people.map((person) => (
                      <div 
                        key={person._id} 
                        onClick={() => setSelectedPerson(person)}
                        className="flex flex-col items-center group cursor-pointer"
                      >
                        <div className="w-full aspect-square rounded-full overflow-hidden mb-3 bg-gray-100 relative border-2 border-transparent group-hover:border-black/10 transition-all shadow-sm">
                          {person.thumbnailUrl ? (
                            <LazyImage
                              imageKey={person.thumbnailUrl}
                              fallback=""
                              className="w-full h-full object-cover"
                              alt={person.name}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <Users className="w-8 h-8 text-gray-200" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="font-bold text-sm text-center truncate w-full px-2">{person.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          {person.photoCount || 0}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 pt-8 border-t border-black/5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                            currentPage === page 
                              ? 'bg-black text-white shadow-md' 
                              : 'text-gray-400 hover:text-black hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
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
                        <LazyImage
                          imageKey={result.embedding.imageUrl}
                          fallback=""
                          className="w-full h-full object-cover"
                          alt={`Match ${i}`}
                        />
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md border ${
                          result.confidence === 'High' ? 'bg-emerald-500/80 border-emerald-400' :
                          result.confidence === 'Medium' ? 'bg-amber-500/80 border-amber-400' :
                          'bg-gray-500/80 border-gray-400'
                        } text-white`}>
                          {result.confidence} Match
                        </div>
                        <div className="bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {Math.round(result.score * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
