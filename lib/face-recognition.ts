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
    
  return detections.map(d => ({
    embedding: Array.from(d.descriptor),
    box: d.detection.box,
  }));
}

export function calculateDistance(embedding1: number[], embedding2: number[]) {
  return faceapi.euclideanDistance(embedding1, embedding2);
}
