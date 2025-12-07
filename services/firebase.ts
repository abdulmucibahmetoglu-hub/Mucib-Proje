
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// ÖNEMLİ: Gerçek verilerle çalışmak için Firebase Console'dan
// yeni bir proje oluşturun ve aşağıdaki bilgileri kendi projenizle değiştirin.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
// We use a try-catch block to prevent the app from crashing entirely if config is invalid (Demo mode fallback)
let app;
let auth;
let db;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase başlatılamadı. Demo modu aktif olacak. (Config ayarlarını kontrol edin)");
}

export { auth, db, googleProvider };
