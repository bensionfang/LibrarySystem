import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log('Library System 啟動中 (Firebase Mode)...');

// --- 0. 新增：Toast 訊息工具 ---
window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // type: 'success' or 'error'
    toast.textContent = message;

    container.appendChild(toast);

    // 動畫進場
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 3秒後消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// --- 全域變數 ---
let isLoggedIn = false;
let allBooks = [];
let priceMode = 'below';

// --- DOM 元素 ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results-area');

// 進階搜尋元素
const advSearchBtn = document.getElementById('adv-search-btn');
const advTitle = document.getElementById('adv-title');
const advAuthor = document.getElementById('adv-author');
const advPublisher = document.getElementById('adv-publisher');
const advIsbn = document.getElementById('adv-isbn');
const advPrice = document.getElementById('adv-price');
const btnPriceAbove = document.getElementById('btn-price-above');
const btnPriceBelow = document.getElementById('btn-price-below');

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
            let cleanAuthor = data.author || '未知作者';
            if (cleanAuthor === '[') cleanAuthor = '未知作者';

            allBooks.push({
                id: doc.id,
                title: data.title || '無標題',
                author: cleanAuthor,
                publisher: data.publisher || '',
                image: data.image || 'https://via.placeholder.com/150',
                price: data.price || 0,
                isbn: data.isbn || ''
            });
        });

        console.log(`成功載入 ${allBooks.length} 本書籍`);

        // 修改：載入完成後，檢查網址是否有搜尋參數 (為了 popular.html 的跳轉)
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');

        if (query && searchInput) {
            searchInput.value = query;
            window.handleGeneralSearch(); // 自動執行搜尋
        } else {
            displayBooks(allBooks); // 正常顯示全部
        }

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
    const bookmarkList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];

    books.forEach(book => {
        const isBorrowed = borrowedList.some(b => b.id === book.id);
        const isBookmarked = bookmarkList.some(b => b.id === book.id);

        const div = document.createElement('div');
        div.className = 'book-item';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.height = '100%';
        div.style.justifyContent = 'space-between';

        div.innerHTML = `
            <div style="flex-grow: 1; display: flex; flex-direction: column;"> 
                <img src="${book.image}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'" style="width:100%; height:200px; object-fit:contain; background-color: #f8f9fa; border-radius: 4px;">
                
                <h3 style="margin: 10px 0; font-size: 16px; line-height: 1.4;">${book.title}</h3>
                
                <div style="text-align: left; font-size: 14px; padding: 0 5px; color: #555;">
                    <p style="margin: 3px 0; color: #333;"><strong>作者：</strong>${book.author}</p>
                    <p style="margin: 3px 0;"><strong>出版社：</strong>${book.publisher}</p>
                    <p style="margin: 3px 0;"><strong>ISBN：</strong>${book.isbn}</p>
                </div>
            </div>

            <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; width: 100%;">
                <p style="color: #e4393c; font-weight: bold; font-size: 18px; margin: 0 0 10px 0;">$${book.price}</p>
                
                <div class="book-actions" style="display: flex; gap: 5px;">
                    <button class="${isBorrowed ? 'btn-borrow disabled' : 'btn-borrow'}" 
                        onclick="window.borrowBook('${book.id}')" style="flex: 2;">
                        ${isBorrowed ? '已借閱' : '借閱'}
                    </button>
                    
                    <button class="${isBookmarked ? 'btn-bookmark active' : 'btn-bookmark'}" 
                        onclick="window.toggleBookmark('${book.id}')" style="flex: 1; border: 1px solid #d9534f; background: ${isBookmarked ? '#d9534f' : '#fff'}; color: ${isBookmarked ? '#fff' : '#d9534f'};">
                        ${isBookmarked ? '♥' : '♡'}
                    </button>
                </div>
            </div>
        `;
        resultsArea.appendChild(div);
    });
}

// --- 3. 搜尋功能 ---
window.handleGeneralSearch = function () {
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) { displayBooks(allBooks); return; }

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        const publisher = (book.publisher || '').toLowerCase();
        return title.includes(keyword) || author.includes(keyword) || isbn.includes(keyword) || publisher.includes(keyword);
    });
    displayBooks(filtered);
}

function handleAdvancedSearch() {
    const t = advTitle ? advTitle.value.trim().toLowerCase() : '';
    const a = advAuthor ? advAuthor.value.trim().toLowerCase() : '';
    const p = advPublisher ? advPublisher.value.trim().toLowerCase() : '';
    const i = advIsbn ? advIsbn.value.trim() : '';
    const pr = advPrice ? parseInt(advPrice.value) : null;

    const filtered = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();
        const isbn = (book.isbn || '').toString();
        const price = book.price ? parseInt(book.price) : 0;

        let matchPrice = true;
        if (pr !== null && !isNaN(pr)) {
            if (priceMode === 'above') matchPrice = price >= pr;
            else matchPrice = price <= pr;
        }

        return (!t || title.includes(t)) && (!a || author.includes(a)) && (!p || publisher.includes(p)) && (!i || isbn.includes(i)) && matchPrice;
    });
    displayBooks(filtered);
}

// --- 4. 登入、借閱、還書、書籤邏輯 (全部改用 showToast) ---
window.openLoginModal = function () { if (modalLogin) modalLogin.classList.remove('hidden'); }
window.closeLoginModal = function () { if (modalLogin) modalLogin.classList.add('hidden'); }

window.performLogin = function () {
    const u = loginUser.value;
    if (u) {
        isLoggedIn = true;
        localStorage.setItem('library_user', u);
        checkLoginStatus();
        window.closeLoginModal();
        window.showToast("登入成功！", "success");
        if (typeof window.renderHistory === 'function') window.renderHistory();
    } else {
        window.showToast("請輸入帳號", "error");
    }
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

// 借書
window.borrowBook = function (bookId) {
    if (!localStorage.getItem('library_user')) {
        window.showToast('請先登入！', 'error');
        window.openLoginModal();
        return;
    }
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    if (list.some(b => b.id === bookId)) {
        window.showToast('已借閱過此書', 'error');
        return;
    }

    let targetBook = allBooks.find(b => b.id === bookId);

    if (!targetBook) {
        const bookmarks = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
        targetBook = bookmarks.find(b => b.id === bookId);
    }

    if (targetBook) {
        targetBook.borrowDate = new Date().toISOString().split('T')[0];
        list.push(targetBook);
        localStorage.setItem('library_borrowed', JSON.stringify(list));
        window.showToast(`成功借閱：${targetBook.title}`, 'success');

        if (resultsArea) displayBooks(allBooks);
        if (typeof window.renderHistory === 'function') window.renderHistory();
        if (typeof window.renderBookmarks === 'function') window.renderBookmarks();
    }
}

// 還書
window.returnBook = function (bookId) {
    let list = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    const newList = list.filter(b => b.id !== bookId);

    if (list.length === newList.length) return;

    localStorage.setItem('library_borrowed', JSON.stringify(newList));
    window.showToast('歸還成功！', 'success');

    if (resultsArea) displayBooks(allBooks);
    if (typeof window.renderHistory === 'function') window.renderHistory();
}

// 書籤 (改用 showToast)
window.toggleBookmark = function (bookId) {
    if (!localStorage.getItem('library_user')) {
        window.showToast('請先登入才能使用收藏功能！', 'error');
        window.openLoginModal();
        return;
    }

    let list = JSON.parse(localStorage.getItem('library_bookmarked')) || [];
    const index = list.findIndex(b => b.id === bookId);

    if (index >= 0) {
        list.splice(index, 1);
        window.showToast('已移除收藏', 'success');
    } else {
        let targetBook = allBooks.find(b => b.id === bookId);
        if (!targetBook) {
            const borrowed = JSON.parse(localStorage.getItem('library_borrowed')) || [];
            targetBook = borrowed.find(b => b.id === bookId);
        }

        if (targetBook) {
            list.push(targetBook);
            window.showToast('已加入收藏！', 'success');
        }
    }
    localStorage.setItem('library_bookmarked', JSON.stringify(list));

    if (resultsArea) displayBooks(allBooks);
    if (typeof window.renderBookmarks === 'function') window.renderBookmarks();
}

// --- 5. 事件監聽 (初始化) ---
window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    if (document.getElementById('search-hero-section')) {
        loadBooks();
    }

    if (searchButton) searchButton.addEventListener('click', window.handleGeneralSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.handleGeneralSearch();
        });
    }
    if (advSearchBtn) advSearchBtn.addEventListener('click', handleAdvancedSearch);

    if (btnPriceAbove && btnPriceBelow) {
        btnPriceAbove.addEventListener('click', () => {
            priceMode = 'above';
            btnPriceAbove.classList.add('active');
            btnPriceBelow.classList.remove('active');
        });

        btnPriceBelow.addEventListener('click', () => {
            priceMode = 'below';
            btnPriceBelow.classList.add('active');
            btnPriceAbove.classList.remove('active');
        });
    }

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

    const logoBtn = document.getElementById('logo-btn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if (searchInput) {
                searchInput.value = e.target.textContent;
                window.handleGeneralSearch();
            }
        });
    });
});