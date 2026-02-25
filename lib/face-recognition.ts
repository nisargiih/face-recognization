'use client';

import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
}

export async function getFaceEmbeddings(imageElement: HTMLImageElement | HTMLCanvasElement) {
  await loadModels();
  const detections = await faceapi.detectAllFaces(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptors();
    
  return detections.map(d => {
    // Extract face thumbnail
    const { x, y, width, height } = d.detection.box;
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        imageElement,
        x, y, width, height,
        0, 0, 150, 150
      );
    }
    
    return {
      embedding: Array.from(d.descriptor),
      box: d.detection.box,
      thumbnail: canvas.toDataURL('image/jpeg', 0.7),
    };
  });
}

export function calculateDistance(embedding1: number[], embedding2: number[]) {
  if (!embedding1 || !embedding2 || embedding1.length === 0 || embedding1.length !== embedding2.length) {
    return 1; // Return max distance (no match) if vectors are incompatible
  }
  return faceapi.euclideanDistance(embedding1, embedding2);
}
