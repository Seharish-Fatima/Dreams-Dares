// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔑 your real config (no placeholders)
const firebaseConfig = {
  apiKey: "AIzaSyD5La3pmXI3jsDZsGcKEArXWGF5PVCdrZc",
  authDomain: "dreamsanddares-97f2a.firebaseapp.com",
  projectId: "dreamsanddares-97f2a",
  storageBucket: "dreamsanddares-97f2a.firebasestorage.app",
  messagingSenderId: "457816654247",
  appId: "1:457816654247:web:dd20f4badae1e75a74b682",
  // measurementId is optional; you can leave it out
};

console.log("Firebase config loaded:", firebaseConfig); // debug: ensure THIS logs, not placeholders

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

signInAnonymously(auth).catch((e) => {
  console.error("Auth error:", e.code, e.message);
});

onAuthStateChanged(auth, (user) => {
  if (user) console.log("✅ Signed in anonymously:", user.uid);
});
