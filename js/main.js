console.log('Library System 已啟動');

// --- 0. 全域狀態 ---
let isLoggedIn = false;

// --- 1. 資料區 ---
// 原本是 const allBooks = [ ...寫死資料... ]
// 現在改成「由 books.json 動態載入」
let allBooks = [];

// --- 2. 抓取元素 ---
const logoBtn = document.getElementById('logo-btn');
const navHome = document.getElementById('nav-home');

// 登入相關
const btnLoginTrigger = document.getElementById('btn-login-trigger');
const btnLogout = document.getElementById('btn-logout');
const modalLogin = document.getElementById('modal-login');
const btnLoginSubmit = document.getElementById('btn-login-submit');
const closeLoginBtn = document.querySelector('.login-close');
const userDisplay = document.getElementById('user-display');
const authLinks = document.querySelectorAll('.auth-link');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');

// 搜尋與介面
const tabGeneral = document.getElementById('tab-general');
const tabAdvanced = document.getElementById('tab-advanced');
const panelGeneral = document.getElementById('panel-general');
const panelAdvanced = document.getElementById('panel-advanced');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const advSearchBtn = document.getElementById('adv-search-btn');
const advTitle = document.getElementById('adv-title');
const advAuthor = document.getElementById('adv-author');
const advPublisher = document.getElementById('adv-publisher');
const resultsArea = document.getElementById('results-area');

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
