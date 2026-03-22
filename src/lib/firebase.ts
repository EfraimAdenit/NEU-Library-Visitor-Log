import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBXxG-1BHy7YQbN6NRH_1l599XxHE-Ihig",
  authDomain: "neubetalibrary-477a6.firebaseapp.com",
  projectId: "neubetalibrary-477a6",
  storageBucket: "neubetalibrary-477a6.firebasestorage.app",
  messagingSenderId: "442576049557",
  appId: "1:442576049557:web:be2eb17d9ae9961525529c",
  measurementId: "G-8754EGD05Y",
};

// Firestore settings that fix the "client is offline" error in Next.js / Vercel environments.
// - experimentalForceLongPolling: avoids WebSocket/gRPC issues on serverless/proxy environments
// - useFetchStreams: false: disables the fetch-based streaming which breaks on some cloud networks
const FIRESTORE_SETTINGS = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
};

let app: FirebaseApp;
let db: Firestore;

const existingApps = getApps();

if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, FIRESTORE_SETTINGS);
} else {
  app = getApp();
  // On subsequent module evaluations (Next.js hot reload), we must re-apply settings.
  // getFirestore returns the existing instance which already has the settings applied.
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
