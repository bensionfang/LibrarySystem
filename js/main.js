// ===== 全域變數 =====
let allBooks = [];

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results');

// 預設：資料未載入前，禁止搜尋（重點修正）
searchButton.disabled = true;

// ===== 資料載入（範例：fetch JSON）=====
fetch('data/books.json')   // ← 依你的實際資料路徑
    .then(res => res.json())
    .then(data => {
        allBooks = data;
        displayBooks(allBooks);

        // 資料載入完成後，才開放搜尋
        searchButton.disabled = false;
    })
    .catch(err => {
        console.error('資料載入失敗', err);
    });

// ===== 搜尋事件 =====
searchButton.addEventListener('click', handleGeneralSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGeneralSearch();
});

// ===== 搜尋邏輯（已修正）=====
function handleGeneralSearch() {
    if (!allBooks || allBooks.length === 0) {
        alert('資料尚未載入完成，請稍後再試');
        return;
    }

    const keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
        displayBooks(allBooks);
        return;
    }

    const filteredBooks = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();

        return (
            title.includes(keyword) ||
            author.includes(keyword) ||
            isbn.includes(keyword)
        );
    });

    displayBooks(filteredBooks);
}

// ===== 顯示結果（避免疊加錯誤）=====
function displayBooks(books) {
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p>查無相關書籍</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <h3>${book.title}</h3>
            <p>作者：${book.author || '未知'}</p>
            <p>ISBN：${book.isbn || '無'}</p>
        `;
        resultsArea.appendChild(div);
    });
}
// ===== 全域變數 =====
let allBooks = [];

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results');

// 預設：資料未載入前，禁止搜尋（重點修正）
searchButton.disabled = true;

// ===== 資料載入（範例：fetch JSON）=====
fetch('data/books.json')   // ← 依你的實際資料路徑
    .then(res => res.json())
    .then(data => {
        allBooks = data;
        displayBooks(allBooks);

        // 資料載入完成後，才開放搜尋
        searchButton.disabled = false;
    })
    .catch(err => {
        console.error('資料載入失敗', err);
    });

// ===== 搜尋事件 =====
searchButton.addEventListener('click', handleGeneralSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGeneralSearch();
});

// ===== 搜尋邏輯（已修正）=====
function handleGeneralSearch() {
    if (!allBooks || allBooks.length === 0) {
        alert('資料尚未載入完成，請稍後再試');
        return;
    }

    const keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
        displayBooks(allBooks);
        return;
    }

    const filteredBooks = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();

        return (
            title.includes(keyword) ||
            author.includes(keyword) ||
            isbn.includes(keyword)
        );
    });

    displayBooks(filteredBooks);
}

// ===== 顯示結果（避免疊加錯誤）=====
function displayBooks(books) {
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p>查無相關書籍</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <h3>${book.title}</h3>
            <p>作者：${book.author || '未知'}</p>
            <p>ISBN：${book.isbn || '無'}</p>
        `;
        resultsArea.appendChild(div);
    });
}
// ===== 全域變數 =====
let allBooks = [];

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results');

// 預設：資料未載入前，禁止搜尋（重點修正）
searchButton.disabled = true;

// ===== 資料載入（範例：fetch JSON）=====
fetch('data/books.json')   // ← 依你的實際資料路徑
    .then(res => res.json())
    .then(data => {
        allBooks = data;
        displayBooks(allBooks);

        // 資料載入完成後，才開放搜尋
        searchButton.disabled = false;
    })
    .catch(err => {
        console.error('資料載入失敗', err);
    });

// ===== 搜尋事件 =====
searchButton.addEventListener('click', handleGeneralSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGeneralSearch();
});

// ===== 搜尋邏輯（已修正）=====
function handleGeneralSearch() {
    if (!allBooks || allBooks.length === 0) {
        alert('資料尚未載入完成，請稍後再試');
        return;
    }

    const keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
        displayBooks(allBooks);
        return;
    }

    const filteredBooks = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();

        return (
            title.includes(keyword) ||
            author.includes(keyword) ||
            isbn.includes(keyword)
        );
    });

    displayBooks(filteredBooks);
}

// ===== 顯示結果（避免疊加錯誤）=====
function displayBooks(books) {
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p>查無相關書籍</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <h3>${book.title}</h3>
            <p>作者：${book.author || '未知'}</p>
            <p>ISBN：${book.isbn || '無'}</p>
        `;
        resultsArea.appendChild(div);
    });
}
// ===== 全域變數 =====
let allBooks = [];

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results');

// 預設：資料未載入前，禁止搜尋（重點修正）
searchButton.disabled = true;

// ===== 資料載入（範例：fetch JSON）=====
fetch('data/books.json')   // ← 依你的實際資料路徑
    .then(res => res.json())
    .then(data => {
        allBooks = data;
        displayBooks(allBooks);

        // 資料載入完成後，才開放搜尋
        searchButton.disabled = false;
    })
    .catch(err => {
        console.error('資料載入失敗', err);
    });

// ===== 搜尋事件 =====
searchButton.addEventListener('click', handleGeneralSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGeneralSearch();
});

// ===== 搜尋邏輯（已修正）=====
function handleGeneralSearch() {
    if (!allBooks || allBooks.length === 0) {
        alert('資料尚未載入完成，請稍後再試');
        return;
    }

    const keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
        displayBooks(allBooks);
        return;
    }

    const filteredBooks = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();

        return (
            title.includes(keyword) ||
            author.includes(keyword) ||
            isbn.includes(keyword)
        );
    });

    displayBooks(filteredBooks);
}

// ===== 顯示結果（避免疊加錯誤）=====
function displayBooks(books) {
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p>查無相關書籍</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <h3>${book.title}</h3>
            <p>作者：${book.author || '未知'}</p>
            <p>ISBN：${book.isbn || '無'}</p>
        `;
        resultsArea.appendChild(div);
    });
}
// ===== 全域變數 =====
let allBooks = [];

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsArea = document.getElementById('results');

// 預設：資料未載入前，禁止搜尋（重點修正）
searchButton.disabled = true;

// ===== 資料載入（範例：fetch JSON）=====
fetch('data/books.json')   // ← 依你的實際資料路徑
    .then(res => res.json())
    .then(data => {
        allBooks = data;
        displayBooks(allBooks);

        // 資料載入完成後，才開放搜尋
        searchButton.disabled = false;
    })
    .catch(err => {
        console.error('資料載入失敗', err);
    });

// ===== 搜尋事件 =====
searchButton.addEventListener('click', handleGeneralSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGeneralSearch();
});

// ===== 搜尋邏輯（已修正）=====
function handleGeneralSearch() {
    if (!allBooks || allBooks.length === 0) {
        alert('資料尚未載入完成，請稍後再試');
        return;
    }

    const keyword = searchInput.value.trim().toLowerCase();

    if (keyword === '') {
        displayBooks(allBooks);
        return;
    }

    const filteredBooks = allBooks.filter(book => {
        const title = (book.title || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const isbn = (book.isbn || '').toString();

        return (
            title.includes(keyword) ||
            author.includes(keyword) ||
            isbn.includes(keyword)
        );
    });

    displayBooks(filteredBooks);
}

// ===== 顯示結果（避免疊加錯誤）=====
function displayBooks(books) {
    resultsArea.innerHTML = '';

    if (books.length === 0) {
        resultsArea.innerHTML = '<p>查無相關書籍</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <h3>${book.title}</h3>
            <p>作者：${book.author || '未知'}</p>
            <p>ISBN：${book.isbn || '無'}</p>
        `;
        resultsArea.appendChild(div);
    });
}
