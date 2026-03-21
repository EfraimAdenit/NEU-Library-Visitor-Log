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

// Initialize Firebase — only initialise once. Use a flag variable to track if this is first run.
let app: FirebaseApp;
let db: Firestore;

const existingApps = getApps();

if (existingApps.length === 0) {
  // First time: initialize the app AND Firestore with long-polling enabled
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} else {
  // App already running (Next.js hot reload): safely get existing instances
  app = getApp();
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
