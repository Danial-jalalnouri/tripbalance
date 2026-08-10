// Firebase configuration
// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABZqTGUal8nkd0nIiIkpwtkEqeuiygRds",
    authDomain: "coursebag-tripbalance.firebaseapp.com",
    projectId: "coursebag-tripbalance",
    storageBucket: "coursebag-tripbalance.firebasestorage.app",
    messagingSenderId: "253526726975",
    appId: "1:253526726975:web:a283d27913b5f9e1005b8a",
    measurementId: "G-2S2HGJ79JJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Firebase Authentication
const auth = firebase.auth();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
