// js/main.js - 最終修正版 (已加入價格顯示)
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
window.loadBooks = async function () {
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

// --- 2. 顯示書籍 (在此加入價格顯示) ---
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

        // 核心修改處：innerHTML 加入了價格與 ISBN 的顯示
        div.innerHTML = `
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>作者：${book.author}</p>
                <p style="font-size:12px; color:#999;">出版社: ${book.publisher}</p>
                <p style="color: #e4393c; font-weight: bold; font-size: 1.1em; margin: 8px 0;">價格：$${book.price}</p>
                <p style="font-size:11px; color:#ccc;">ISBN: ${book.isbn}</p>
                <div class="book-actions">
                    <button class="${isBorrowed ? 'btn-borrow disabled' : 'btn-borrow'}" 
                        onclick="window.borrowBook('${book.id}')">
                        ${isBorrowed ? '已借閱' : '借閱'}
                    </button>
                </div>
            </div>
        `;
        resultsArea.appendChild(div);
    });
}

// --- 3. 搜尋功能 (一般搜尋) ---
window.handleGeneralSearch = function () {
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {
        displayBooks(allBooks);
        return;
    }

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        const publisher = (book.publisher || '').toLowerCase();

        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword) || publisher.includes(keyword);
    });

    displayBooks(filtered);
}

// --- 進階搜尋 ---
function handleAdvancedSearch() {
    const t = advTitle ? advTitle.value.trim().toLowerCase() : '';
    const a = advAuthor ? advAuthor.value.trim().toLowerCase() : '';
    const p = advPublisher ? advPublisher.value.trim().toLowerCase() : '';

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

// --- 4. 登入與借閱邏輯 ---
window.openLoginModal = function () { if (modalLogin) modalLogin.classList.remove('hidden'); }
window.closeLoginModal = function () { if (modalLogin) modalLogin.classList.add('hidden'); }

window.performLogin = function () {
    const u = loginUser.value;
    if (u) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        alert("登入成功！");
    } else { alert("請輸入帳號"); }
}

window.performLogout = function () {
    localStorage.removeItem('library_user');
    window.location.reload();
}

function checkLoginStatus() {
    const u = localStorage.getItem('library_user');
    if (u) {
        isLoggedIn = true;
        if (userDisplay) { userDisplay.textContent = u + " 您好"; userDisplay.classList.remove('hidden'); }
        if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
    }
}

window.borrowBook = function (bookId) {
    if (!isLoggedIn) {
        alert('請先登入！');
        window.openLoginModal();
        return;
    }
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) { alert('已借閱過此書'); return; }

    const targetBook = allBooks.find(b => b.id === bookId);
    if (targetBook) {
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

    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.handleGeneralSearch();
        });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if (searchInput) {
                searchInput.value = e.target.textContent;
                window.handleGeneralSearch();
            }
        });
    });

    if (tabGeneral && tabAdvanced) {
        tabGeneral.addEventListener('click', () => {
            tabGeneral.classList.add('active'); tabAdvanced.classList.remove('active');
            panelGeneral.classList.remove('hidden'); panelAdvanced.classList.add('hidden');
        });
        tabAdvanced.addEventListener('click', () => {
            tabAdvanced.classList.add('active'); tabGeneral.classList.remove('active');
            panelAdvanced.classList.remove('hidden'); panelGeneral.classList.add('hidden');
        });
    }

    if (btnLoginTrigger) btnLoginTrigger.addEventListener('click', window.openLoginModal);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', window.closeLoginModal);
    if (btnLoginSubmit) btnLoginSubmit.addEventListener('click', window.performLogin);
    if (btnLogout) btnLogout.addEventListener('click', window.performLogout);
});