/* 這是 JavaScript 的註解
   JS 程式碼是「由上到下」執行的
*/

// console.log() 是 JS 的「印出」指令
// 它會把訊息印在瀏覽器的「主控台 (Console)」裡
console.log('JavaScript 檔案載入成功！ (大腦已上線)');

// 這是我們圖書館的「書本資料庫」(大腦的記憶)
// allBooks 是一個「陣列」 (Array)
const allBooks = [
    {
        title: 'JavaScript 忍者手冊',
        author: 'John Resig',
        image: 'https://via.placeholder.com/100x150'
    },
    {
        title: '深入淺出 Python',
        author: 'Paul Barry',
        image: 'https://via.placeholder.com/100x150'
    },
    {
        title: 'HTML 5 權威指南',
        author: 'Adam Freeman',
        image: 'https://via.placeholder.com/100x150'
    }
];
// (我們故意多加了一本 HTML 5，等一下用來驗證)

// --- 步驟 1: 告訴 JS (大腦) 去抓取 HTML (骨架) 上的元件 ---

// 1. 找到 id 為 "search-button" 的那個按鈕
//    並把它存在一個叫做 searchButton 的「變數」(盒子) 裡
const searchButton = document.getElementById('search-button');

// 2. 找到 id 為 "search-input" 的那個輸入框
//    並把它存在一個叫做 searchInput 的「變數」(盒子) 裡
const searchInput = document.getElementById('search-input');

// --- 步驟 3: 抓取 HTML 上的「畫布」 (結果區) ---
const resultsArea = document.getElementById('results-area');


// --- 步驟 4: 定義一個「畫圖」的函式 (Function) ---

// 我們定義一個新指令，叫做 displayBooks
// 它需要一個參數 (booksToShow)，代表「要畫哪些書」
function displayBooks(booksToShow) {

    console.log('開始執行「畫圖」功能...');

    // 1. 在畫圖前，先把畫布清空 (否則書會一直疊上去)
    resultsArea.innerHTML = '<h2>搜尋結果</h2>'; // 保留標題，其餘清空

    // 2. 「迴圈」：針對 "booksToShow" 這個清單裡的「每一本」書...
    booksToShow.forEach( (book) => {
        // ...都執行一次大括號 { } 裡面的程式碼

        // 3. 準備要畫上去的 HTML 內容
        // (注意：這裡用的是「反引號 `」，在鍵盤左上角 1 的隔壁)
        const bookHtml = `
            <div class="book-item">
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p>作者: ${book.author}</p>
            </div>
        `;

        // 4. 把這段 HTML 加到畫布 (resultsArea) 上
        resultsArea.innerHTML += bookHtml;
    });
}

// --- 步驟 5: 網頁一載入，就立刻執行一次「畫圖」功能 ---

// 執行我們剛剛定義的函式，並把「所有的書」(allBooks) 當作材料傳進去
displayBooks(allBooks);

// --- 步驟 6: 幫按鈕「綁定」一個監聽事件 (升級版！) ---

searchButton.addEventListener('click', () => {

    console.log('按鈕被點擊了！');
    
    // 1. 取得使用者輸入的「關鍵字」
    //    .toLowerCase() 是「轉換成小寫」，這樣搜尋 "python" 也能找到 "Python"
    const query = searchInput.value.toLowerCase();
    
    console.log('使用者輸入了 (小寫)：', query);

    // 2. 【關鍵步驟】用「篩選」(filter) 功能，產生一個新書單
    //    - 我們去 allBooks (所有書) 裡跑一個「篩選」
    //    - 每一本書 (book) 都檢查...
    const filteredBooks = allBooks.filter( (book) => {
        
        // ...它的「書名 (title)」(也轉成小寫)
        // ...是否「包含 (includes)」使用者輸入的關鍵字 (query)
        //    如果是，就 return true (保留這本書)
        //    如果不是，就 return false (丟掉這本書)
        return book.title.toLowerCase().includes(query);
    });

    // 3. 把篩選完的結果 (filteredBooks) 印到主控台看看
    console.log('篩選後的書本：', filteredBooks);

    // 4. 【最後一步】呼叫「畫圖」功能，但這次只畫「篩選過的書」
    //    大腦 (JS) 命令畫布 (HTML)：「全部清掉，只畫這個 new_list 裡的書！」
    displayBooks(filteredBooks);

});