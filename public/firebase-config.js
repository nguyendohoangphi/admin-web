import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHVY4BkADf37Tb9JPd4-K4xjjil1TBleY",
    authDomain: "phinom-coffee.firebaseapp.com",
    projectId: "phinom-coffee",
    storageBucket: "phinom-coffee.firebasestorage.app",
    messagingSenderId: "14197951991",
    appId: "1:14197951991:web:113de3a34d88fde52372f2",
    measurementId: "G-73407XVH4S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, app, auth };
