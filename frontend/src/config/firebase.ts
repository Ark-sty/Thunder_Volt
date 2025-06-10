
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyALnK5Jtqd2VDB9e17cS7IlD8UG5athxjE",
    authDomain: "assignment-timeline.firebaseapp.com",
    projectId: "assignment-timeline",
    storageBucket: "assignment-timeline.firebasestorage.app",
    messagingSenderId: "37156616408",
    appId: "1:37156616408:web:e6c29eff783acce12e7fad",
    measurementId: "G-16N04JBT7E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app; 