console.log('Library System 已啟動');

// --- 0. 全域狀態 ---
let isLoggedIn = false;

// --- 1. 資料區 ---
const allBooks = [
    { id: 1, title: 'JavaScript 忍者手冊', author: 'John Resig', publisher: '碁峰資訊', image: 'https://via.placeholder.com/100x150' },
    { id: 2, title: '深入淺出 Python', author: 'Paul Barry', publisher: '歐萊禮', image: 'https://via.placeholder.com/100x150' },
    { id: 3, title: 'HTML 5 權威指南', author: 'Adam Freeman', publisher: '碁峰資訊', image: 'https://via.placeholder.com/100x150' },
    { id: 4, title: '原子習慣', author: 'James Clear', publisher: '方智', image: 'https://via.placeholder.com/100x150' }
];

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

// 書房專用區塊
const historyTableBody = document.getElementById('history-table-body');
const bookmarksContainer = document.getElementById('bookmarks-container'); // 新增

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
}

function performLogin() {
    const user = loginUser.value;
    const pass = loginPass.value;
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
    if(confirm('確定要登出嗎？')) {
        localStorage.removeItem('library_user');
        isLoggedIn = false;
        window.location.reload(); 
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
        
        // 重新整理畫面 (讓按鈕變灰)
        // 這裡我們簡單重新執行上次的搜尋顯示，或是直接刷新當前列表
        // 為了簡單，我們直接重新呼叫 displayBooks 顯示目前列表
        // (但在實際專案可能需要只更新該按鈕)
        // 這裡我們暫時不重新整理搜尋結果，而是手動更新按鈕會比較複雜
        // 最簡單的方法：重新整理頁面 (或重新觸發搜尋)。
        // 這裡為了使用者體驗，我們直接修改按鈕樣式 (進階操作)
        const btn = document.querySelector(`button[onclick="borrowBook(${bookId})"]`);
        if(btn) {
            btn.textContent = '已借閱';
            btn.classList.add('disabled');
            btn.removeAttribute('onclick');
        }
    }
}

// 收藏/取消收藏功能 (新功能)
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
            if(btn) {
                btn.classList.add('active');
                btn.textContent = '已收藏';
            }
        }
    } else {
        // 已經收藏 -> 移除
        bookmarkedList.splice(bookIndex, 1);
        showToast('已取消收藏', 'normal');
        if(btn) {
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

// 渲染「我的書房」收藏列表 (新功能)
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

// 顯示書本列表 (最重要的更新：判斷按鈕狀態)
function displayBooks(booksToShow) {
    if (!resultsArea) return;
    resultsArea.innerHTML = '';
    if (booksToShow.length === 0) {
        resultsArea.innerHTML = '<p style="color:#666; width:100%; text-align:center;">找不到符合條件的書籍。</p>';
        return;
    }

    // 讀取目前的借閱和收藏狀態
    const borrowedList = JSON.parse(localStorage.getItem('library_borrowed')) || [];
    const bookmarkedList = JSON.parse(localStorage.getItem('library_bookmarked')) || [];

    booksToShow.forEach((book) => {
        // 檢查狀態
        const isBorrowed = borrowedList.some(b => b.id === book.id);
        const isBookmarked = bookmarkedList.some(b => b.id === book.id);

        // 設定按鈕文字與樣式
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

function switchTab(mode) {
    if (mode === 'general') {
        tabGeneral?.classList.add('active');
        tabAdvanced?.classList.remove('active');
        panelGeneral?.classList.remove('hidden');
        panelAdvanced?.classList.add('hidden');
    } else if (mode === 'advanced') {
        tabAdvanced?.classList.add('active');
        tabGeneral?.classList.remove('active');
        panelAdvanced?.classList.remove('hidden');
        panelGeneral?.classList.add('hidden');
    }
}

function resetHome() {
    if (!document.getElementById('search-hero-section')) {
        window.location.href = 'index.html';
        return;
    }
    document.body.classList.remove('searching');
    if (searchInput) searchInput.value = '';
    if (advTitle) advTitle.value = '';
    switchTab('general');
    displayBooks(allBooks);
}

function openLoginModal() { modalLogin?.classList.remove('hidden'); }
function closeLoginModal() { modalLogin?.classList.add('hidden'); }

// --- 4. 事件監聽 ---
logoBtn?.addEventListener('click', resetHome);
navHome?.addEventListener('click', (e) => {
    if (document.getElementById('search-hero-section')) {
        e.preventDefault();
        resetHome();
    }
});

authLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        if (!isLoggedIn) {
            e.preventDefault();
            showToast('請先登入會員', 'error');
            openLoginModal();
        }
    });
});

btnLoginTrigger?.addEventListener('click', openLoginModal);
closeLoginBtn?.addEventListener('click', closeLoginModal);
btnLoginSubmit?.addEventListener('click', performLogin);
btnLogout?.addEventListener('click', performLogout);
window.addEventListener('click', (e) => { if (e.target === modalLogin) closeLoginModal(); });
tabGeneral?.addEventListener('click', () => switchTab('general'));
tabAdvanced?.addEventListener('click', () => switchTab('advanced'));

searchButton?.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase().trim();
    const filteredBooks = allBooks.filter(book => book.title.toLowerCase().includes(query));
    document.body.classList.add('searching');
    displayBooks(filteredBooks);
});

advSearchBtn?.addEventListener('click', () => {
    const tVal = advTitle.value.trim().toLowerCase();
    const aVal = advAuthor.value.trim().toLowerCase();
    const pVal = advPublisher.value.trim().toLowerCase();
    const filteredBooks = allBooks.filter(book => {
        const matchTitle = tVal ? book.title.toLowerCase().includes(tVal) : true;
        const matchAuthor = aVal ? book.author.toLowerCase().includes(aVal) : true;
        const matchPublisher = pVal ? book.publisher.toLowerCase().includes(pVal) : true;
        return matchTitle && matchAuthor && matchPublisher;
    });
    document.body.classList.add('searching');
    displayBooks(filteredBooks);
});

// --- 初始化 ---
checkLoginStatus();
displayBooks(allBooks);
renderLibraryHistory();
renderLibraryBookmarks(); // 初始化書籤列表