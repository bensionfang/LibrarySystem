// 當整個網頁都載入完成後，再執行裡面的程式碼
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsSection = document.getElementById('resultsSection');

    let allBooks = []; // 用來存放所有書籍資料

    // 1. 載入書籍資料 (使用 fetch API)
    fetch('books.json')
        .then(response => response.json()) // 將回應轉換成 JSON 格式
        .then(data => {
            allBooks = data; // 將資料存到 allBooks 變數
            displayBooks(allBooks); // 預設顯示所有書籍
        })
        .catch(error => console.error('載入書籍資料時發生錯誤:', error));

    // 2. 監聽搜尋按鈕的點擊事件
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.toLowerCase(); // 取得輸入框的值並轉成小寫
        const filteredBooks = allBooks.filter(book => {
            return book.title.toLowerCase().includes(query);
        });
        displayBooks(filteredBooks);
    });

    // 3. 顯示書籍的函式
    function displayBooks(books) {
        resultsSection.innerHTML = ''; // 先清空目前的結果
        books.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.classList.add('book-item'); // 方便用 CSS 控制樣式
            bookElement.innerHTML = `
                <img src="${book.image}" alt="${book.title}">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                </div>
            `;
            resultsSection.appendChild(bookElement);
        });
    }
});

// 在你的 displayBooks 函式裡面...
// ... 產生 bookElement 的地方 ...

bookElement.addEventListener('click', () => {
    // 1. 找到 modal 並填入內容
    const modalDetails = document.getElementById('modalBookDetails');
    modalDetails.innerHTML = `
        <h2>${book.title}</h2>
        <p>作者: ${book.author}</p>
        <p>出版社: ${book.publisher}</p>
        <p>出版日期: ${book.publication_date}</p>
        <p>ISBN: ${book.isbn}</p>
        <p>簡介: ${book.description}</p>
    `;

    // 2. 顯示 modal
    document.getElementById('bookModal').style.display = 'block';
});

// ... 記得還要寫關閉 modal 的邏輯 ...