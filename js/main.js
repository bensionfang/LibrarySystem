// js/main.js

// 1. 引入 Firebase
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log('Library System 啟動中 (Firebase Mode)...');

// --- 全域變數 ---
let isLoggedIn = false;
let allBooks = []; // 這是關鍵！搜尋功能就是搜尋這個陣列

// --- DOM 元素 ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results-area');
// 進階搜尋元素
const advSearchBtn = document.getElementById('adv-search-btn');
const advTitle = document.getElementById('adv-title');
const advAuthor = document.getElementById('adv-author');
const advPublisher = document.getElementById('adv-publisher');
// 登入相關
const btnLoginTrigger = document.getElementById('btn-login-trigger');
const modalLogin = document.getElementById('modal-login');
const closeLoginBtn = document.querySelector('.login-close');
const btnLoginSubmit = document.getElementById('btn-login-submit');
const btnLogout = document.getElementById('btn-logout');
const userDisplay = document.getElementById('user-display');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
// Tab 切換
const tabGeneral = document.getElementById('tab-general');
const tabAdvanced = document.getElementById('tab-advanced');
const panelGeneral = document.getElementById('panel-general');
const panelAdvanced = document.getElementById('panel-advanced');

// --- 1. 核心功能：從 Firebase 載入書籍 ---
window.loadBooks = async function() {
    if (!resultsArea) return; // 如果不在首頁就不用載入
    
    resultsArea.innerHTML = '<p style="text-align:center; padding:20px;">正在連線雲端資料庫...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        allBooks = []; // 清空舊資料

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allBooks.push({
                id: doc.id,
                title: data.title || '無標題',
                author: data.author || '未知作者',
                publisher: data.publisher || '',
                // 確保圖片路徑正確，如果沒有就用預設圖
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks); // 載入完成後直接顯示全部

    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js 設定。</p>';
    }
}

// --- 2. 顯示書籍 (渲染畫面) ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = ''; // 清空目前的畫面

    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }

    books.forEach(book => {
        // 判斷是否已借閱 (從 LocalStorage 讀取)
        const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
        const isBorrowed = borrowedList.some(b => b.id === book.id);

        // 建立書籍卡片 HTML
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${book.title}</h3>
            <p>作者：${book.author}</p>
            <p style="font-size:12px; color:#999;">ISBN: ${book.isbn}</p>
            <div class="book-actions">
                <button class="${isBorrowed ? 'btn-borrow disabled' : 'btn-borrow'}" 
                    onclick="window.borrowBook('${book.id}')">
                    ${isBorrowed ? '已借閱' : '借閱'}
                </button>
            </div>
        `;
        resultsArea.appendChild(div);
    });
}

// --- 3. 搜尋功能 (修復重點) ---
function handleGeneralSearch() {
    const keyword = searchInput.value.trim().toLowerCase();
    console.log("搜尋關鍵字:", keyword);

    if (!keyword) {
        displayBooks(allBooks); // 沒輸入就顯示全部
        return;
    }

    // 篩選 allBooks 陣列
    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        // 只要書名、作者或 ISBN 包含關鍵字就算符合
        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword);
    });

    displayBooks(filtered);
}

function handleAdvancedSearch() {
    const t = advTitle.value.trim().toLowerCase();
    const a = advAuthor.value.trim().toLowerCase();
    const p = advPublisher.value.trim().toLowerCase();

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();
        
        return (!t || title.includes(t)) && 
               (!a || author.includes(a)) && 
               (!p || publisher.includes(p));
    });

    displayBooks(filtered);
}

// --- 4. 借閱與登入功能 (掛載到 window 以便 HTML onclick 呼叫) ---
window.borrowBook = function(bookId) {
    if (!isLoggedIn) {
        alert('請先登入！(測試帳號: admin / 密碼: 1234)');
        if(modalLogin) modalLogin.classList.remove('hidden');
        return;
    }
    
    // 檢查是否借過
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        alert('這本書已經在您的借閱清單中了！');
        return;
    }

    // 找到這本書的資料
    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        targetBook.status = '借閱中';
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks); // 重新整理按鈕狀態
    }
}

// 登入邏輯
window.performLogin = function() {
    const u = loginUser.value;
    const p = loginPass.value;
    if (u && p) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        if(modalLogin) modalLogin.classList.add('hidden');
        alert("登入成功！");
    } else {
        alert("請輸入帳號密碼");
    }
}

window.performLogout = function() {
    localStorage.removeItem('library_user');
    isLoggedIn = false;
    window.location.reload();
}

function checkLoginStatus() {
    const u = localStorage.getItem('library_user');
    if (u) {
        isLoggedIn = true;
        if(userDisplay) {
            userDisplay.textContent = u + " 您好";
            userDisplay.classList.remove('hidden');
        }
        if(btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if(btnLogout) btnLogout.classList.remove('hidden');
    }
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks(); // 程式一開始就去抓資料

    // 綁定搜尋按鈕事件
    if (searchButton) {
        searchButton.addEventListener('click', handleGeneralSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGeneralSearch();
        });
    }
    if (advSearchBtn) {
        advSearchBtn.addEventListener('click', handleAdvancedSearch);
    }

    // 綁定 Tab 切換
    if(tabGeneral && tabAdvanced) {
        tabGeneral.addEventListener('click', () => {
            tabGeneral.classList.add('active');
            tabAdvanced.classList.remove('active');
            panelGeneral.classList.remove('hidden');
            panelAdvanced.classList.add('hidden');
        });
        tabAdvanced.addEventListener('click', () => {
            tabAdvanced.classList.add('active');
            tabGeneral.classList.remove('active');
            panelAdvanced.classList.remove('hidden');
            panelGeneral.classList.add('hidden');
        });
    }

    // 綁定登入視窗開關
    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', () => modalLogin.classList.remove('hidden'));
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', () => modalLogin.classList.add('hidden'));
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});// --- 1. 核心功能：從 Firebase 載入書籍 ---
window.loadBooks = async function() {
    if (!resultsArea) return; // 如果不在首頁就不用載入
    
    resultsArea.innerHTML = '<p style="text-align:center; padding:20px;">正在連線雲端資料庫...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        allBooks = []; // 清空舊資料

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allBooks.push({
                id: doc.id,
                title: data.title || '無標題',
                author: data.author || '未知作者',
                publisher: data.publisher || '',
                // 確保圖片路徑正確，如果沒有就用預設圖
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks); // 載入完成後直接顯示全部

    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js 設定。</p>';
    }
}

// --- 2. 顯示書籍 (渲染畫面) ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = ''; // 清空目前的畫面

    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }

    books.forEach(book => {
        // 判斷是否已借閱 (從 LocalStorage 讀取)
        const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
        const isBorrowed = borrowedList.some(b => b.id === book.id);

        // 建立書籍卡片 HTML
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${book.title}</h3>
            <p>作者：${book.author}</p>
            <p style="font-size:12px; color:#999;">ISBN: ${book.isbn}</p>
            <div class="book-actions">
                <button class="${isBorrowed ? 'btn-borrow disabled' : 'btn-borrow'}" 
                    onclick="window.borrowBook('${book.id}')">
                    ${isBorrowed ? '已借閱' : '借閱'}
                </button>
            </div>
        `;
        resultsArea.appendChild(div);
    });
}

// --- 3. 搜尋功能 (修復重點) ---
function handleGeneralSearch() {
    const keyword = searchInput.value.trim().toLowerCase();
    console.log("搜尋關鍵字:", keyword);

    if (!keyword) {
        displayBooks(allBooks); // 沒輸入就顯示全部
        return;
    }

    // 篩選 allBooks 陣列
    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        // 只要書名、作者或 ISBN 包含關鍵字就算符合
        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword);
    });

    displayBooks(filtered);
}

function handleAdvancedSearch() {
    const t = advTitle.value.trim().toLowerCase();
    const a = advAuthor.value.trim().toLowerCase();
    const p = advPublisher.value.trim().toLowerCase();

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();
        
        return (!t || title.includes(t)) && 
               (!a || author.includes(a)) && 
               (!p || publisher.includes(p));
    });

    displayBooks(filtered);
}

// --- 4. 借閱與登入功能 (掛載到 window 以便 HTML onclick 呼叫) ---
window.borrowBook = function(bookId) {
    if (!isLoggedIn) {
        alert('請先登入！(測試帳號: admin / 密碼: 1234)');
        if(modalLogin) modalLogin.classList.remove('hidden');
        return;
    }
    
    // 檢查是否借過
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        alert('這本書已經在您的借閱清單中了！');
        return;
    }

    // 找到這本書的資料
    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        targetBook.status = '借閱中';
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks); // 重新整理按鈕狀態
    }
}

// 登入邏輯
window.performLogin = function() {
    const u = loginUser.value;
    const p = loginPass.value;
    if (u && p) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        if(modalLogin) modalLogin.classList.add('hidden');
        alert("登入成功！");
    } else {
        alert("請輸入帳號密碼");
    }
}

window.performLogout = function() {
    localStorage.removeItem('library_user');
    isLoggedIn = false;
    window.location.reload();
}

function checkLoginStatus() {
    const u = localStorage.getItem('library_user');
    if (u) {
        isLoggedIn = true;
        if(userDisplay) {
            userDisplay.textContent = u + " 您好";
            userDisplay.classList.remove('hidden');
        }
        if(btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if(btnLogout) btnLogout.classList.remove('hidden');
    }
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks(); // 程式一開始就去抓資料

    // 綁定搜尋按鈕事件
    if (searchButton) {
        searchButton.addEventListener('click', handleGeneralSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGeneralSearch();
        });
    }
    if (advSearchBtn) {
        advSearchBtn.addEventListener('click', handleAdvancedSearch);
    }

    // 綁定 Tab 切換
    if(tabGeneral && tabAdvanced) {
        tabGeneral.addEventListener('click', () => {
            tabGeneral.classList.add('active');
            tabAdvanced.classList.remove('active');
            panelGeneral.classList.remove('hidden');
            panelAdvanced.classList.add('hidden');
        });
        tabAdvanced.addEventListener('click', () => {
            tabAdvanced.classList.add('active');
            tabGeneral.classList.remove('active');
            panelAdvanced.classList.remove('hidden');
            panelGeneral.classList.add('hidden');
        });
    }

    // 綁定登入視窗開關
    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', () => modalLogin.classList.remove('hidden'));
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', () => modalLogin.classList.add('hidden'));
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});const bookmarksContainer = document.getElementById('bookmarks-container');

// --- 3. 核心功能函式 ---

// 顯示吐司訊息 (維持不變)
function showToast(message, type = 'normal') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// 登入狀態檢查 (維持不變)
function checkLoginStatus() {
    const savedUser = localStorage.getItem('library_user');
    if (savedUser) {
        isLoggedIn = true;
        updateUIForLogin(savedUser);
    }
}

function updateUIForLogin(username) {
    if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
    if (userDisplay) {
        userDisplay.classList.remove('hidden');
        userDisplay.textContent = username + " 同學";
    }
    if (btnLogout) btnLogout.classList.remove('hidden');
    authLinks.forEach(link => link.classList.remove('disabled'));
}

// 登入相關函式需掛載到 window (因為 module 作用域關係)
window.openLoginModal = function() {
    if (!modalLogin) return;
    modalLogin.classList.remove('hidden');
}

window.closeLoginModal = function() {
    if (!modalLogin) return;
    modalLogin.classList.add('hidden');
}

window.performLogin = function() {
    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();
    if (user && pass) {
        isLoggedIn = true;
        showToast('登入成功！歡迎 ' + user, 'success');
        localStorage.setItem('library_user', user);
        updateUIForLogin(user);
        window.closeLoginModal();
    } else {
        showToast('請輸入帳號密碼！', 'error');
    }
}

window.performLogout = function() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('library_user');
        localStorage.removeItem('library_borrowed');
        localStorage.removeItem('library_bookmarked');
        isLoggedIn = false;
        window.location.reload();
    }
}

// ★★★ 2. 修改：改為從 Firebase 載入資料 ★★★
window.loadBooks = async function() {
    try {
        console.log("正在連線 Firebase 讀取書籍...");
        
        // 使用 getDocs 從 "books" 集合抓取資料
        const querySnapshot = await getDocs(collection(db, "books"));
        
        let firebaseBooks = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            firebaseBooks.push({
                id: doc.id, // 使用 Firebase 的亂碼 ID
                title: data.title || '無標題',
                author: data.author || '未知作者',
                publisher: data.publisher || '',
                image: data.image || 'https://via.placeholder.com/100x150',
                price: data.price || '',
                availability: data.availability || 'In Stock'
            });
        });

        allBooks = firebaseBooks; // 更新全域變數
        console.log('成功從 Firebase 載入', allBooks.length, '筆書籍');
        displayBooks(allBooks);

    } catch (err) {
        console.error('Firebase 讀取失敗：', err);
        showToast('無法連線到雲端資料庫', 'error');
    }
}

// 借書功能 (掛載到 window)
window.borrowBook = function(bookId) {
    // 注意：bookId 在 Firebase 是字串，但如果你的邏輯依賴數字，這裡可能要注意
    // 這裡我們直接用 string ID 處理即可
    if (!isLoggedIn) {
        showToast('請先登入會員才能借閱！', 'error');
        window.openLoginModal();
        return;
    }

    let borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (borrowedList.some(book => book.id === bookId)) {
        showToast('您已經借閱過這本書了！', 'error');
        return;
    }

    const bookToAdd = allBooks.find(book => book.id === bookId);
    if (bookToAdd) {
        const today = new Date().toISOString().split('T')[0];
        const record = { ...bookToAdd, borrowDate: today, status: '借閱中' };
        borrowedList.push(record);
        localStorage.setItem('library_borrowed', JSON.stringify(borrowedList));
        showToast(`《${bookToAdd.title}》借閱成功！`, 'success');
        
        // 更新按鈕狀態
        // 注意：因為 ID 可能是字串，querySelector 寫法要小心引號
        const btn = document.querySelector(`button[onclick="borrowBook('${bookId}')"]`) || document.querySelector(`button[onclick="borrowBook(${bookId})"]`);
        if (btn) {
            btn.textContent = '已借閱';
            btn.classList.add('disabled');
            btn.removeAttribute('onclick');
        } else {
             // 如果找不到按鈕，重新渲染整個列表最保險
             displayBooks(allBooks);
        }
    }
}

// 收藏功能 (掛載到 window)
window.toggleBookmark = function(bookId) {
    if (!isLoggedIn) {
        showToast('請先登入會員才能使用收藏功能！', 'error');
        window.openLoginModal();
        return;
    }

    let bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
    const bookIndex = bookmarkedList.findIndex(book => book.id === bookId);

    if (bookIndex === -1) {
        const bookToAdd = allBooks.find(book => book.id === bookId);
        if (bookToAdd) {
            bookmarkedList.push(bookToAdd);
            showToast('已加入收藏', 'success');
        }
    } else {
        bookmarkedList.splice(bookIndex, 1);
        showToast('已取消收藏', 'normal');
        if (bookmarksContainer) renderLibraryBookmarks();
    }
    localStorage.setItem('library_bookmarked', JSON.stringify(bookmarkedList));
    // 重新顯示以更新按鈕狀態
    if(resultsArea) displayBooks(allBooks);
    if(bookmarksContainer) renderLibraryBookmarks();
}

// 渲染借閱紀錄 (掛載到 window，雖然不一定被 HTML 直接呼叫，但保持一致)
window.returnBook = function(bookId) {
    let borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    borrowedList = borrowedList.filter(book => book.id !== bookId);
    localStorage.setItem('library_borrowed', JSON.stringify(borrowedList));
    showToast('歸還成功！', 'success');
    renderLibraryHistory();
}

function renderLibraryHistory() {
    if (!historyTableBody) return;
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    historyTableBody.innerHTML = '';
    if (borrowedList.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">目前沒有借閱紀錄</td></tr>';
        return;
    }
    borrowedList.forEach(book => {
        // ID 加上引號以支援字串 ID
        historyTableBody.innerHTML += `
            <tr>
                <td>${book.title}</td>
                <td>${book.borrowDate}</td>
                <td style="color:green; font-weight:bold;">${book.status}</td>
                <td><button onclick="returnBook('${book.id}')" style="font-size:12px; cursor:pointer;">歸還</button></td>
            </tr>
        `;
    });
}

function renderLibraryBookmarks() {
    if (!bookmarksContainer) return;
    const bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
    bookmarksContainer.innerHTML = '';
    if (bookmarkedList.length === 0) {
        bookmarksContainer.innerHTML = '<p style="color:#999;">暫無收藏書籍</p>';
        return;
    }
    bookmarkedList.forEach(book => {
        bookmarksContainer.innerHTML += `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <div class="book-actions">
                     <button class="btn-bookmark active" onclick="toggleBookmark('${book.id}')">已收藏</button>
                </div>
            </div>
        `;
    });
}

// 顯示列表 (加上引號處理 ID)
function displayBooks(booksToShow) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';
    if (!booksToShow || booksToShow.length === 0) {
        resultsArea.innerHTML = '<p style="color:#666; width:100%; text-align:center;">找不到符合條件的書籍。</p>';
        return;
    }
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    const bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];

    booksToShow.forEach((book) => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
        const isBookmarked = bookmarkedList.some(b => b.id === book.id);
        
        // 確保 ID 被單引號包起來，例如 borrowBook('abc12345')
        const borrowBtnAction = isBorrowed ? '' : `onclick="borrowBook('${book.id}')"`;

        resultsArea.innerHTML += `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <p style="font-size: 12px; color: #999;">${book.publisher}</p>
                <div class="book-actions">
                    <button class="${isBorrowed ? 'btn-borrow disabled' : 'btn-borrow'}" ${borrowBtnAction}>
                        ${isBorrowed ? '已借閱' : '借閱'}
                    </button>
                    <button class="${isBookmarked ? 'btn-bookmark active' : 'btn-bookmark'}" onclick="toggleBookmark('${book.id}')">
                        ${isBookmarked ? '已收藏' : '收藏'}
                    </button>
                </div>
            </div>
        `;
    });
}

// Tab 與搜尋邏輯
function switchTab(mode) {
    if (!tabGeneral) return;
    if (mode === 'general') {
        tabGeneral.classList.add('active');
        tabAdvanced.classList.remove('active');
        panelGeneral.classList.remove('hidden');
        panelAdvanced.classList.add('hidden');
    } else {
        tabAdvanced.classList.add('active');
        tabGeneral.classList.remove('active');
        panelAdvanced.classList.remove('hidden');
        panelGeneral.classList.add('hidden');
    }
}

function handleGeneralSearch() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) { displayBooks(allBooks); return; }
    const filtered = allBooks.filter(book => (book.title || '').toLowerCase().includes(keyword));
    displayBooks(filtered);
}

function handleAdvancedSearch() {
    if (!advTitle) return;
    const t = advTitle.value.trim().toLowerCase();
    const a = advAuthor.value.trim().toLowerCase();
    const p = advPublisher.value.trim().toLowerCase();
    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();
        return ((!t || title.includes(t)) && (!a || author.includes(a)) && (!p || publisher.includes(p)));
    });
    displayBooks(filtered);
}

// --- 4. 事件綁定 ---
function setupEventListeners() {
    if (logoBtn) logoBtn.addEventListener('click', () => window.location.href = 'index.html');
    if (navHome) navHome.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'index.html'; });

    // 按鈕監聽 (這些 ID 在 HTML 裡已經不存在 onclick，所以這裡監聽沒問題)
    if (btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if (btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if (btnLogout) btnLogout.addEventListener('click', window.performLogout);

    if (tabGeneral) tabGeneral.addEventListener('click', () => switchTab('general'));
    if (tabAdvanced) tabAdvanced.addEventListener('click', () => switchTab('advanced'));

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleGeneralSearch);
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleGeneralSearch(); });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);
}

// --- 5. 初始化 ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
    switchTab('general');

    // 首頁：載入 Firebase 資料
    if (resultsArea) {
        window.loadBooks();
    }
    // 書房：渲染紀錄
    if (historyTableBody) renderLibraryHistory();
    if (bookmarksContainer) renderLibraryBookmarks();
});const resultsArea = document.getElementById('results-area');

// 書房專用區塊（只在 my-library.html 會存在）
const historyTableBody = document.getElementById('history-table-body');
const bookmarksContainer = document.getElementById('bookmarks-container');

// --- 3. 核心功能函式 ---

// 顯示吐司訊息
function showToast(message, type = 'normal') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('library_user');
    if (savedUser) {
        isLoggedIn = true;
        updateUIForLogin(savedUser);
    }
}

function updateUIForLogin(username) {
    if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
    if (userDisplay) {
        userDisplay.classList.remove('hidden');
        userDisplay.textContent = username + " 同學";
    }
    if (btnLogout) btnLogout.classList.remove('hidden');

    // 「我的書房」連結只有登入後才啟用（如果你們有這樣設計）
    authLinks.forEach(link => {
        link.classList.remove('disabled');
    });
}

function openLoginModal() {
    if (!modalLogin) return;
    modalLogin.classList.remove('hidden');
}

function closeLoginModal() {
    if (!modalLogin) return;
    modalLogin.classList.add('hidden');
}

function performLogin() {
    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();
    if (user && pass) {
        isLoggedIn = true;
        showToast('登入成功！歡迎 ' + user, 'success');
        localStorage.setItem('library_user', user);
        updateUIForLogin(user);
        closeLoginModal();
    } else {
        showToast('請輸入帳號密碼！', 'error');
    }
}

function performLogout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('library_user');
        localStorage.removeItem('library_borrowed');
        localStorage.removeItem('library_bookmarked');
        isLoggedIn = false;
        window.location.reload();
    }
}

// --- 3-1. 由 books.json 載入館藏資料（★你爬蟲的成果在這裡用到） ---
async function loadBooks() {
    try {
        const res = await fetch('books.json');
        const data = await res.json();

        // 假設 books.json 來自 books.toscrape.com 爬蟲：
        // { title, price, availability }
        // 這裡 mapping 成前端原本使用的格式
        allBooks = data.map((book, index) => ({
            id: index + 1,                                   // 建立唯一 ID
            title: book.title || '未命名書籍',
            author: book.author || '未知作者',               // 如果之後爬得到作者也可以填進來
            publisher: book.publisher || '未知出版社',
            image: 'https://via.placeholder.com/100x150',    // 沒封面先用佔位圖
            price: book.price || '',
            availability: book.availability || ''
        }));

        console.log('成功載入 books.json，共', allBooks.length, '筆書籍');
        displayBooks(allBooks);
    } catch (err) {
        console.error('載入 books.json 失敗：', err);
        showToast('無法載入館藏資料', 'error');
    }
}

// 借書功能
function borrowBook(bookId) {
    if (!isLoggedIn) {
        showToast('請先登入會員才能借閱！', 'error');
        openLoginModal();
        return;
    }

    let borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];

    // 再次檢查 (防止重複)
    if (borrowedList.some(book => book.id === bookId)) {
        showToast('您已經借閱過這本書了！', 'error');
        return;
    }

    const bookToAdd = allBooks.find(book => book.id === bookId);
    if (bookToAdd) {
        const today = new Date().toISOString().split('T')[0];
        const record = { ...bookToAdd, borrowDate: today, status: '借閱中' };

        borrowedList.push(record);
        localStorage.setItem('library_borrowed', JSON.stringify(borrowedList));

        showToast(`《${bookToAdd.title}》借閱成功！`, 'success');

        const btn = document.querySelector(`button[onclick="borrowBook(${bookId})"]`);
        if (btn) {
            btn.textContent = '已借閱';
            btn.classList.add('disabled');
            btn.removeAttribute('onclick');
        }
    }
}

// 收藏/取消收藏功能
function toggleBookmark(bookId) {
    if (!isLoggedIn) {
        showToast('請先登入會員才能使用收藏功能！', 'error');
        openLoginModal();
        return;
    }

    let bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
    const bookIndex = bookmarkedList.findIndex(book => book.id === bookId);
    const btn = document.querySelector(`button[onclick="toggleBookmark(${bookId})"]`);

    if (bookIndex === -1) {
        // 還沒收藏 -> 加入
        const bookToAdd = allBooks.find(book => book.id === bookId);
        if (bookToAdd) {
            bookmarkedList.push(bookToAdd);
            showToast('已加入收藏', 'success');
            if (btn) {
                btn.classList.add('active');
                btn.textContent = '已收藏';
            }
        }
    } else {
        // 已經收藏 -> 移除
        bookmarkedList.splice(bookIndex, 1);
        showToast('已取消收藏', 'normal');
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = '收藏';
        }

        // 如果是在書房頁面，要即時移除該卡片
        if (bookmarksContainer) {
            renderLibraryBookmarks();
        }
    }
    localStorage.setItem('library_bookmarked', JSON.stringify(bookmarkedList));
}

// 渲染「我的書房」借閱表格
function renderLibraryHistory() {
    if (!historyTableBody) return;
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    historyTableBody.innerHTML = '';

    if (borrowedList.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">目前沒有借閱紀錄</td></tr>';
        return;
    }

    borrowedList.forEach(book => {
        historyTableBody.innerHTML += `
            <tr>
                <td>${book.title}</td>
                <td>${book.borrowDate}</td>
                <td style="color:green; font-weight:bold;">${book.status}</td>
                <td><button onclick="returnBook(${book.id})" style="font-size:12px; cursor:pointer;">歸還</button></td>
            </tr>
        `;
    });
}

// 渲染「我的書房」收藏列表
function renderLibraryBookmarks() {
    if (!bookmarksContainer) return;
    const bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
    bookmarksContainer.innerHTML = '';

    if (bookmarkedList.length === 0) {
        bookmarksContainer.innerHTML = '<p style="color:#999;">暫無收藏書籍</p>';
        return;
    }

    bookmarkedList.forEach(book => {
        bookmarksContainer.innerHTML += `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <div class="book-actions">
                     <button class="btn-bookmark active" onclick="toggleBookmark(${book.id})">已收藏</button>
                </div>
            </div>
        `;
    });
}

// 歸還書籍
function returnBook(bookId) {
    let borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    borrowedList = borrowedList.filter(book => book.id !== bookId);
    localStorage.setItem('library_borrowed', JSON.stringify(borrowedList));
    showToast('歸還成功！', 'success');
    renderLibraryHistory();
}

// 顯示書本列表（首頁搜尋結果）
function displayBooks(booksToShow) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';
    if (!booksToShow || booksToShow.length === 0) {
        resultsArea.innerHTML = '<p style="color:#666; width:100%; text-align:center;">找不到符合條件的書籍。</p>';
        return;
    }
    // 讀取目前的借閱和收藏狀態
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    const bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];

    booksToShow.forEach((book) => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
        const isBookmarked = bookmarkedList.some(b => b.id === book.id);

        const borrowBtnClass = isBorrowed ? 'btn-borrow disabled' : 'btn-borrow';
        const borrowBtnText = isBorrowed ? '已借閱' : '借閱';
        const borrowBtnAction = isBorrowed ? '' : `onclick="borrowBook(${book.id})"`;

        const bookmarkBtnClass = isBookmarked ? 'btn-bookmark active' : 'btn-bookmark';
        const bookmarkBtnText = isBookmarked ? '已收藏' : '收藏';

        resultsArea.innerHTML += `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <p style="font-size: 12px; color: #999;">${book.publisher}</p>
                <div class="book-actions">
                    <button class="${borrowBtnClass}" ${borrowBtnAction}>${borrowBtnText}</button>
                    <button class="${bookmarkBtnClass}" onclick="toggleBookmark(${book.id})">${bookmarkBtnText}</button>
                </div>
            </div>
        `;
    });
}

// 切換一般 / 進階查詢 tab
function switchTab(mode) {
    if (!tabGeneral || !tabAdvanced || !panelGeneral || !panelAdvanced) return;

    if (mode === 'general') {
        tabGeneral.classList.add('active');
        tabAdvanced.classList.remove('active');
        panelGeneral.classList.remove('hidden');
        panelAdvanced.classList.add('hidden');
    } else if (mode === 'advanced') {
        tabAdvanced.classList.add('active');
        tabGeneral.classList.remove('active');
        panelAdvanced.classList.remove('hidden');
        panelGeneral.classList.add('hidden');
    }
}

// 一般搜尋（書名 / 關鍵字）
function handleGeneralSearch() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) {
        displayBooks(allBooks);
        return;
    }
    const filtered = allBooks.filter(book =>
        (book.title || '').toLowerCase().includes(keyword)
    );
    displayBooks(filtered);
}

// 進階搜尋（書名 + 作者 + 出版社）
function handleAdvancedSearch() {
    if (!advTitle || !advAuthor || !advPublisher) return;

    const t = advTitle.value.trim().toLowerCase();
    const a = advAuthor.value.trim().toLowerCase();
    const p = advPublisher.value.trim().toLowerCase();

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();

        return (
            (!t || title.includes(t)) &&
            (!a || author.includes(a)) &&
            (!p || publisher.includes(p))
        );
    });

    displayBooks(filtered);
}

// --- 4. 事件綁定 ---
function setupEventListeners() {
    // Logo / 首頁
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // 登入相關
    if (btnLoginTrigger) {
        btnLoginTrigger.addEventListener('click', openLoginModal);
    }
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', closeLoginModal);
    }
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener('click', performLogin);
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', performLogout);
    }

    // Tab 切換
    if (tabGeneral) {
        tabGeneral.addEventListener('click', () => switchTab('general'));
    }
    if (tabAdvanced) {
        tabAdvanced.addEventListener('click', () => switchTab('advanced'));
    }

    // 一般搜尋
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handleGeneralSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGeneralSearch();
        });
    }

    // 進階搜尋
    if (advSearchBtn) {
        advSearchBtn.addEventListener('click', handleAdvancedSearch);
    }
}

// --- 5. 初始化 ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
    switchTab('general');

    // 首頁：載入 books.json 後顯示館藏
    if (resultsArea) {
        loadBooks();
    }

    // 我的書房頁面：渲染借閱紀錄 / 收藏
    if (historyTableBody) {
        renderLibraryHistory();
    }
    if (bookmarksContainer) {
        renderLibraryBookmarks();
    }
});
