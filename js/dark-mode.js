// js/dark-mode.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // 1. 檢查 LocalStorage：使用者之前是不是選過深色模式？
    const currentTheme = localStorage.getItem('theme');
    
    // 如果之前是 dark，就加上 class，並把按鈕文字改成太陽
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if(toggleBtn) toggleBtn.textContent = '☀️';
    }

    // 2. 監聽按鈕點擊事件
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // 切換 class
            body.classList.toggle('dark-mode');

            // 判斷現在是什麼模式，並存入 LocalStorage
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark'); // 記住：他是深色派
                toggleBtn.textContent = '☀️'; // 按鈕變成太陽
            } else {
                localStorage.setItem('theme', 'light'); // 記住：他是淺色派
                toggleBtn.textContent = '🌙'; // 按鈕變成月亮
            }
        });
    }
});