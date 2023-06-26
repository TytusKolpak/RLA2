// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";               // Maybe will be used later
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
// const analytics = getAnalytics(app);                             // Maybe will be used later
export const firestore = getFirestore(app)