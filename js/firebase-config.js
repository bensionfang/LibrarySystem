// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// 1. 新增：引入 Storage 功能
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSE5MDSWh1LgR-G4q0r9-rNACs69srrTo", 
  authDomain: "ibrary-system.firebaseapp.com",
  projectId: "ibrary-system",
  storageBucket: "ibrary-system.firebasestorage.app",
  messagingSenderId: "91859614058",
  appId: "1:91859614058:web:130c54d58a615ef0f24d13"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// 2. 新增：初始化 Storage
const storage = getStorage(app);

// 3. 修改：記得要把 storage 也匯出
export { db, storage };
