  // Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js"; 
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBIPvEN1grTH_wu07L7sJys1ezihgAjvOw",
    authDomain: "smartvoicebilling.firebaseapp.com",
    projectId: "smartvoicebilling",
    storageBucket: "smartvoicebilling.firebasestorage.app",
    messagingSenderId: "168060871478",
    appId: "1:168060871478:web:09dd36414334c535650997"
  };

    // Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);