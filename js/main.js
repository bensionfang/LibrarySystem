import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log('Library System 啟動中 (Firebase Mode)...');

// --- 全域變數 ---
let isLoggedIn = false;
let allBooks = [];

// --- DOM 元素 ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results-area');
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

// --- 1. 從 Firebase 載入書籍 ---
window.loadBooks = async function() {
    if (!resultsArea) return;
    resultsArea.innerHTML = '<p style="text-align:center; padding:20px;">正在連線雲端資料庫...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        allBooks = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allBooks.push({
                id: doc.id,
                title: data.title || '無標題',
                author: data.author || '未知作者',
                publisher: data.publisher || '',
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });
        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks);
    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js。</p>';
    }
}

// --- 2. 顯示書籍 ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';
    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    books.forEach(book => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${book.title}</h3>
            <p>作者：${book.author}</p>
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

// --- 3. 搜尋功能 ---
window.handleGeneralSearch = function() {
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!keyword) { displayBooks(allBooks); return; }
    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
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
        return (!t || title.includes(t)) && (!a || author.includes(a)) && (!p || publisher.includes(p));
    });
    displayBooks(filtered);
}

// --- 4. 登入與其他 ---
window.openLoginModal = function() { if(modalLogin) modalLogin.classList.remove('hidden'); }
window.closeLoginModal = function() { if(modalLogin) modalLogin.classList.add('hidden'); }
window.performLogin = function() {
    const u = loginUser.value;
    if (u) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        alert("登入成功！");
    } else { alert("請輸入帳號"); }
}
window.performLogout = function() {
    localStorage.removeItem('library_user');
    window.location.reload();
}
function checkLoginStatus() {
    const u = localStorage.getItem('library_user');
    if (u) {
        isLoggedIn = true;
        if(userDisplay) { userDisplay.textContent = u + " 您好"; userDisplay.classList.remove('hidden'); }
        if(btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if(btnLogout) btnLogout.classList.remove('hidden');
    }
}
window.borrowBook = function(bookId) {
    if (!isLoggedIn) { alert('請先登入！'); window.openLoginModal(); return; }
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) { alert('已借閱過此書'); return; }
    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks);
    }
}

// --- 5. 初始化 ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks();

    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.handleGeneralSearch(); });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    // ★★★ 綁定熱門關鍵字點擊 ★★★
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if(searchInput) {
                searchInput.value = e.target.textContent;
                window.handleGeneralSearch();
            }
        });
    });

    if(tabGeneral) {
        tabGeneral.addEventListener('click', () => {
            tabGeneral.classList.add('active'); tabAdvanced.classList.remove('active');
            panelGeneral.classList.remove('hidden'); panelAdvanced.classList.add('hidden');
        });
    }
    if(tabAdvanced) {
        tabAdvanced.addEventListener('click', () => {
            tabAdvanced.classList.add('active'); tabGeneral.classList.remove('active');
            panelAdvanced.classList.remove('hidden'); panelGeneral.classList.add('hidden');
        });
    }

    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});const tabAdvanced = document.getElementById('tab-advanced');
const panelGeneral = document.getElementById('panel-general');
const panelAdvanced = document.getElementById('panel-advanced');

// --- 1. 核心功能：從 Firebase 載入書籍 ---
window.loadBooks = async function() {
    if (!resultsArea) return; 
    
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
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks); // 載入完成後顯示全部

    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js 設定，或確認資料庫權限。</p>';
    }
}

// --- 2. 顯示書籍 ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }

    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];

    books.forEach(book => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
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
window.handleGeneralSearch = function() {
    const keyword = searchInput.value.trim().toLowerCase();
    
    if (!keyword) {
        displayBooks(allBooks);
        return;
    }

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        // 加入出版社搜尋
        const publisher = (book.publisher || '').toLowerCase();

        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword) || publisher.includes(keyword);
    });

    displayBooks(filtered);
}

// 進階搜尋
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

// --- 4. 登入與借閱功能 ---
// 掛載到 window 讓 HTML onclick 可以呼叫
window.openLoginModal = function() {
    if(modalLogin) modalLogin.classList.remove('hidden');
}

window.closeLoginModal = function() {
    if(modalLogin) modalLogin.classList.add('hidden');
}

window.performLogin = function() {
    const u = loginUser.value;
    const p = loginPass.value;
    // 簡單模擬登入
    if (u && p) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        alert("登入成功！");
    } else {
        alert("請輸入帳號密碼");
    }
}

window.performLogout = function() {
    if(confirm("確定要登出嗎？")) {
        localStorage.removeItem('library_user');
        isLoggedIn = false;
        window.location.reload();
    }
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

window.borrowBook = function(bookId) {
    if (!isLoggedIn) {
        alert('請先登入！(測試帳號: admin / 密碼: 1234)');
        window.openLoginModal();
        return;
    }
    
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        alert('這本書已經在您的借閱清單中了！');
        return;
    }

    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        targetBook.status = '借閱中';
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks); 
    }
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks(); 

    // 搜尋按鈕
    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.handleGeneralSearch();
        });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    // Tab 切換
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

    // ★★★ 修復熱門關鍵字點擊 ★★★
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            const text = e.target.textContent;
            if(searchInput) {
                searchInput.value = text;
                window.handleGeneralSearch(); // 自動搜尋
            }
        });
    });

    // 登入介面事件
    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});// js/main.js - 完整修復版

// 1. 引入 Firebase
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log('Library System 啟動中 (Firebase Mode)...');

// --- 全域變數 ---
let isLoggedIn = false;
let allBooks = []; // 用來存從資料庫抓下來的書

// --- DOM 元素 ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results-area');
const keywordsContainer = document.querySelector('.keywords'); // 抓取熱門關鍵字區域

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
    if (!resultsArea) return; 
    
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
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks); // 載入完成後顯示全部

    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js 設定，或確認資料庫權限。</p>';
    }
}

// --- 2. 顯示書籍 ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }

    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];

    books.forEach(book => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
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
window.handleGeneralSearch = function() {
    const keyword = searchInput.value.trim().toLowerCase();
    
    if (!keyword) {
        displayBooks(allBooks);
        return;
    }

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        // 加入出版社搜尋
        const publisher = (book.publisher || '').toLowerCase();

        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword) || publisher.includes(keyword);
    });

    displayBooks(filtered);
}

// 進階搜尋
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

// --- 4. 登入與借閱功能 ---
// 掛載到 window 讓 HTML onclick 可以呼叫
window.openLoginModal = function() {
    if(modalLogin) modalLogin.classList.remove('hidden');
}

window.closeLoginModal = function() {
    if(modalLogin) modalLogin.classList.add('hidden');
}

window.performLogin = function() {
    const u = loginUser.value;
    const p = loginPass.value;
    // 簡單模擬登入
    if (u && p) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        alert("登入成功！");
    } else {
        alert("請輸入帳號密碼");
    }
}

window.performLogout = function() {
    if(confirm("確定要登出嗎？")) {
        localStorage.removeItem('library_user');
        isLoggedIn = false;
        window.location.reload();
    }
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

window.borrowBook = function(bookId) {
    if (!isLoggedIn) {
        alert('請先登入！(測試帳號: admin / 密碼: 1234)');
        window.openLoginModal();
        return;
    }
    
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        alert('這本書已經在您的借閱清單中了！');
        return;
    }

    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        targetBook.status = '借閱中';
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks); 
    }
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks(); 

    // 搜尋按鈕
    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.handleGeneralSearch();
        });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    // Tab 切換
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

    // ★★★ 修復熱門關鍵字點擊 ★★★
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            const text = e.target.textContent;
            if(searchInput) {
                searchInput.value = text;
                window.handleGeneralSearch(); // 自動搜尋
            }
        });
    });

    // 登入介面事件
    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});// js/main.js - 完整修復版

// 1. 引入 Firebase
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log('Library System 啟動中 (Firebase Mode)...');

// --- 全域變數 ---
let isLoggedIn = false;
let allBooks = []; // 用來存從資料庫抓下來的書

// --- DOM 元素 ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results-area');
const keywordsContainer = document.querySelector('.keywords'); // 抓取熱門關鍵字區域

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
    if (!resultsArea) return; 
    
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
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);
        displayBooks(allBooks); // 載入完成後顯示全部

    } catch (error) {
        console.error("Firebase 連線失敗:", error);
        resultsArea.innerHTML = '<p style="color:red; text-align:center;">連線失敗，請檢查 firebase-config.js 設定，或確認資料庫權限。</p>';
    }
}

// --- 2. 顯示書籍 ---
function displayBooks(books) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p style="text-align:center; color:#666;">找不到符合的書籍。</p>';
        return;
    }

    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];

    books.forEach(book => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
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
window.handleGeneralSearch = function() {
    const keyword = searchInput.value.trim().toLowerCase();
    
    if (!keyword) {
        displayBooks(allBooks);
        return;
    }

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        // 加入出版社搜尋
        const publisher = (book.publisher || '').toLowerCase();

        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword) || publisher.includes(keyword);
    });

    displayBooks(filtered);
}

// 進階搜尋
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

// --- 4. 登入與借閱功能 ---
// 掛載到 window 讓 HTML onclick 可以呼叫
window.openLoginModal = function() {
    if(modalLogin) modalLogin.classList.remove('hidden');
}

window.closeLoginModal = function() {
    if(modalLogin) modalLogin.classList.add('hidden');
}

window.performLogin = function() {
    const u = loginUser.value;
    const p = loginPass.value;
    // 簡單模擬登入
    if (u && p) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        alert("登入成功！");
    } else {
        alert("請輸入帳號密碼");
    }
}

window.performLogout = function() {
    if(confirm("確定要登出嗎？")) {
        localStorage.removeItem('library_user');
        isLoggedIn = false;
        window.location.reload();
    }
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

window.borrowBook = function(bookId) {
    if (!isLoggedIn) {
        alert('請先登入！(測試帳號: admin / 密碼: 1234)');
        window.openLoginModal();
        return;
    }
    
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        alert('這本書已經在您的借閱清單中了！');
        return;
    }

    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        targetBook.status = '借閱中';
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        alert(`成功借閱：${targetBook.title}`);
        displayBooks(allBooks); 
    }
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBooks(); 

    // 搜尋按鈕
    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.handleGeneralSearch();
        });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    // Tab 切換
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

    // ★★★ 修復熱門關鍵字點擊 ★★★
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            const text = e.target.textContent;
            if(searchInput) {
                searchInput.value = text;
                window.handleGeneralSearch(); // 自動搜尋
            }
        });
    });

    // 登入介面事件
    if(btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if(btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if(btnLogout) btnLogout.addEventListener('click', window.performLogout);
});
