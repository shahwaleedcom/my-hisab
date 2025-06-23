// src/firebase.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBCyRq7Wu5r6WgZNTmCcL5hyUeG-YNowyo",
  authDomain: "prayerpal-mubvg.firebaseapp.com",
  databaseURL: "https://prayerpal-mubvg-default-rtdb.firebaseio.com",
  projectId: "prayerpal-mubvg",
  storageBucket: "prayerpal-mubvg.appspot.com", // FIXED typo
  messagingSenderId: "926422479254",
  appId: "1:926422479254:web:9331da30d8cc426e206db7"
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

export { app, database };
