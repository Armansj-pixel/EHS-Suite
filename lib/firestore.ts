// lib/firestore.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: AIzaSyDoFgYKHbiKXonkPh7zgKYwaFM2cp_-2WI, // Ganti dengan apiKey yang sesuai
  authDomain: ehs-suite-fedff.firebaseapp.com, // Ganti dengan authDomain yang sesuai
  projectId: ehs-suite-fedff, // Ganti dengan projectId yang sesuai
  storageBucket: ehs-suite-fedff.firebasestorage.app // Ganti dengan storageBucket yang sesuai
  messagingSenderId: 953205445535, // Ganti dengan messagingSenderId yang sesuai
  appId: 1:953205445535:web:9b43938d0749ceaf9263aa, // Ganti dengan appId yang sesuai
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = getFirestore(app);

// Ekspor db untuk digunakan di file lain
export { db };