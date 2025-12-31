// 1. 從網路引入 Firebase 的核心功能 (App) 和資料庫功能 (Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. 這裡就是你在第一步 (Firebase 網頁) 複製的那段設定檔
// ★★★ 請把下面這個區塊，換成你自己的設定 ★★★
const firebaseConfig = {
  apiKey: "AIzaSyDSE5MDSWh1LgR-G4q0r9-rNACs69srrTo", 
  authDomain: "ibrary-system.firebaseapp.com",
  projectId: "ibrary-system",
  storageBucket: "ibrary-system.firebasestorage.app",
  messagingSenderId: "91859614058",
  appId: "1:91859614058:web:130c54d58a615ef0f24d13"
};

// 3. 初始化 Firebase (啟動應用程式)
const app = initializeApp(firebaseConfig);

// 4. 初始化資料庫 (取得資料庫的操作權限)
const db = getFirestore(app);

// 5. 匯出 db 變數
// 這樣其他的檔案 (如 main.js 或 admin.html) 才能透過 import 使用這個 db
export { db };
