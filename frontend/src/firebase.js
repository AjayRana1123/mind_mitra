// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_50JNKoH-iS-lohGP865m4MI8ZRXsT7A",
  authDomain: "mind-mitra2.firebaseapp.com",
  projectId: "mind-mitra2",
  storageBucket: "mind-mitra2.firebasestorage.app",
  messagingSenderId: "329041471352",
  appId: "1:329041471352:web:983df5a76dfe7c7e0f8a8d",
  measurementId: "G-EQS0D4XCEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
