console.log('Library System 已啟動');

// --- 資料區 ---
const allBooks = [
    { title: '第一本書', author: 'John Resig', publisher: '碁峰資訊', image: 'https://via.placeholder.com/100x150' },
    { title: '第二本書', author: 'Paul Barry', publisher: '歐萊禮', image: 'https://via.placeholder.com/100x150' },
    { title: '第三本書', author: 'Adam Freeman', publisher: '碁峰資訊', image: 'https://via.placeholder.com/100x150' }
];

// --- 2. 變數宣告 (抓取 HTML 元素) ---

// 導覽列與 Logo
const logoBtn = document.getElementById('logo-btn');
const navGeneral = document.getElementById('nav-general');   // 下拉選單：一般查詢
const navAdvanced = document.getElementById('nav-advanced'); // 下拉選單：進階查詢

// 頁籤與面板
const tabGeneral = document.getElementById('tab-general');
const tabAdvanced = document.getElementById('tab-advanced');
const panelGeneral = document.getElementById('panel-general');
const panelAdvanced = document.getElementById('panel-advanced');

// 一般搜尋輸入元件
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// 進階搜尋輸入元件
const advSearchBtn = document.getElementById('adv-search-btn');
const advTitle = document.getElementById('adv-title');
const advAuthor = document.getElementById('adv-author');
const advPublisher = document.getElementById('adv-publisher');

// 結果顯示區
const resultsArea = document.getElementById('results-area');


// --- 3. 核心功能函式 ---

// A. 畫出書本列表
function displayBooks(booksToShow) {
    resultsArea.innerHTML = ''; // 先清空

    if (booksToShow.length === 0) {
        resultsArea.innerHTML = '<p style="color:#666; width:100%; text-align:center;">找不到符合條件的書籍。</p>';
        return;
    }

    booksToShow.forEach((book) => {
        const bookHtml = `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
                <p style="font-size: 12px; color: #999;">${book.publisher}</p>
            </div>
        `;
        resultsArea.innerHTML += bookHtml;
    });
}

// B. 切換頁籤 (一般/進階)
function switchTab(mode) {
    if (mode === 'general') {
        // 1. 樣式改變
        tabGeneral.classList.add('active');
        tabAdvanced.classList.remove('active');
        // 2. 面板顯示/隱藏
        panelGeneral.classList.remove('hidden');
        panelAdvanced.classList.add('hidden');
    } else if (mode === 'advanced') {
        // 1. 樣式改變
        tabAdvanced.classList.add('active');
        tabGeneral.classList.remove('active');
        // 2. 面板顯示/隱藏
        panelAdvanced.classList.remove('hidden');
        panelGeneral.classList.add('hidden');
    }
}

// C. 重置回首頁狀態
function resetHome() {
    // 1. 移除 searching class (讓介面回到中間)
    document.body.classList.remove('searching');

    // 2. 清空輸入框
    searchInput.value = '';
    advTitle.value = '';
    advAuthor.value = '';
    advPublisher.value = '';

    // 3. 切回一般查詢頁籤
    switchTab('general');

    // 4. 選擇性：看你要顯示全部書，還是清空結果
    // 這裡示範顯示全部書 (或是你可以用 resultsArea.innerHTML = '' 來清空)
    displayBooks(allBooks);
}


// --- 4. 事件監聽 (Event Listeners) ---

// 1. 點擊 Logo -> 回首頁
logoBtn.addEventListener('click', resetHome);

// 2. 導覽列下拉選單：點擊「一般查詢」 -> 回首頁狀態
navGeneral.addEventListener('click', resetHome);

// 3. 導覽列下拉選單：點擊「進階查詢」
navAdvanced.addEventListener('click', () => {
    // 介面往上推
    document.body.classList.add('searching');
    // 切換到進階頁籤
    switchTab('advanced');
});

// 4. 頁籤切換點擊
tabGeneral.addEventListener('click', () => switchTab('general'));
tabAdvanced.addEventListener('click', () => switchTab('advanced'));

// 5. 執行「一般搜尋」
searchButton.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase().trim();
    const filteredBooks = allBooks.filter(book => book.title.toLowerCase().includes(query));

    document.body.classList.add('searching'); // 介面往上推
    displayBooks(filteredBooks);
});

// 6. 執行「進階搜尋」
advSearchBtn.addEventListener('click', () => {
    const tVal = advTitle.value.trim().toLowerCase();
    const aVal = advAuthor.value.trim().toLowerCase();
    const pVal = advPublisher.value.trim().toLowerCase();

    const filteredBooks = allBooks.filter(book => {
        const matchTitle = tVal ? book.title.toLowerCase().includes(tVal) : true;
        const matchAuthor = aVal ? book.author.toLowerCase().includes(aVal) : true;
        const matchPublisher = pVal ? book.publisher.toLowerCase().includes(pVal) : true;
        return matchTitle && matchAuthor && matchPublisher;
    });

    document.body.classList.add('searching'); // 介面往上推
    displayBooks(filteredBooks);
});

// --- 初始化 ---
// 網頁載入時，先顯示所有書籍 (如果不喜歡一開始有書，可以把這行註解掉)
displayBooks(allBooks);