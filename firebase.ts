import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoFgYKHbiKXonkPh7zgKYwaFM2cp_-2WI",
  authDomain: "ehs-suite-fedff.firebaseapp.com",
  projectId: "ehs-suite-fedff",
  // NOTE: if Storage fails to init, try switching to "ehs-suite-fedff.appspot.com"
  storageBucket: "ehs-suite-fedff.firebasestorage.app",
  messagingSenderId: "953205445535",
  appId: "1:953205445535:web:9b43938d0749ceaf9263aa",
  measurementId: "G-XBNMD978W0",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
