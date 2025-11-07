import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC_vi0XM7Fir9IhImPBvoIsKDhz4_D9HWU",
  authDomain: "officemaster-7ef34.firebaseapp.com",
  databaseURL: "https://officemaster-7ef34-default-rtdb.firebaseio.com",
  projectId: "officemaster-7ef34",
  storageBucket: "officemaster-7ef34.firebasestorage.app",
  messagingSenderId: "99027379557",
  appId: "1:99027379557:web:6d23ac53e9480811db6d8c"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log('✅ Firebase inicializado!');