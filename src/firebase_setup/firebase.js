import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCGnlwLMGR87MIL5Slcb9QDjhBtJeGaRV4",
    authDomain: "rla2-e32f5.firebaseapp.com",
    projectId: "rla2-e32f5",
    storageBucket: "rla2-e32f5.appspot.com",
    messagingSenderId: "855317790654",
    appId: "1:855317790654:web:657c6affc6048c8b2783ef",
    measurementId: "G-783MQY3C4K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app)