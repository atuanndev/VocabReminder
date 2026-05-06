let isPopupOpen = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showPopup" && !isPopupOpen) {
        isPopupOpen = true;
        createOverlay(request.wordData);
    }
});

function createOverlay(wordData) {
    const modal = document.createElement('div');
    modal.id = "vocab-reminder-overlay";
    
    const isNewWord = wordData.repetitions === 0;
    const titleText = isNewWord ? "Bí Kíp Mới Xuất Hiện!" : "Tâm Ma Cản Lối!";
    
    // Nếu từ có thuộc tính, sẽ chèn vào chuỗi để hiển thị
    const typeDisplay = wordData.type ? `<span style="color:#7f8c8d; font-size: 24px; font-style: italic; margin-left: 10px;">${wordData.type}</span>` : "";

    const instructionText = isNewWord 
        ? `Đại nhân hãy ghi nhớ khẩu quyết này:<br><strong style="color:#d32f2f; font-size: 24px; display:block; margin: 10px 0;">${wordData.word} ${typeDisplay} = ${wordData.meaning}</strong>Hãy gõ lại nghĩa tiếng Việt để khắc sâu vào tâm trí.` 
        : "Đại nhân hãy giải mã tâm pháp này để phá trận";
    
    const btnText = isNewWord ? "Đã Ghi Nhớ" : "Phá Trận";

    modal.innerHTML = `
        <div class="vocab-box">
            <h2>${titleText}</h2>
            <p style="font-size: 16px; margin-top: -5px; font-style: italic;">${instructionText}</p>
            <h1 class="vocab-word">${wordData.word} ${typeDisplay}</h1>
            <input type="text" id="vocab-answer" autocomplete="off" placeholder="Gõ nghĩa tiếng Việt vào đây..." />
            <br>
            <button id="vocab-submit">${btnText}</button>
            <p id="vocab-feedback"></p>
        </div>
    `;
    document.body.appendChild(modal);

    const submitBtn = document.getElementById('vocab-submit');
    const inputField = document.getElementById('vocab-answer');
    const feedback = document.getElementById('vocab-feedback');

    setTimeout(() => inputField.focus(), 100);

    submitBtn.addEventListener('click', () => checkAnswer(wordData, inputField, feedback, modal, isNewWord));
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer(wordData, inputField, feedback, modal, isNewWord);
    });
}

function checkAnswer(wordData, inputField, feedback, modal, isNewWord) {
    const userAnswer = inputField.value.trim().toLowerCase();
    const correctAnswer = wordData.meaning.toLowerCase();

    if (userAnswer === correctAnswer) {
        feedback.style.color = "#2e7d32"; 
        feedback.innerText = isNewWord ? "Đã khắc sâu vào tiềm thức! Thuộc hạ xin lui." : "Khẩu quyết chính xác! Chúc mừng đại nhân đột phá!";
        
        chrome.runtime.sendMessage({ action: "updateWord", wordId: wordData.id, quality: 4 });
        
        setTimeout(() => {
            modal.remove();
            isPopupOpen = false;
        }, 1200);
    } else {
        feedback.style.color = "#d32f2f"; 
        feedback.innerText = isNewWord 
            ? "Đại nhân gõ sai rồi, xin hãy nhìn kỹ khẩu quyết phía trên và gõ lại!" 
            : "Tẩu hỏa nhập ma! Khẩu quyết đúng phải là: " + wordData.meaning;
        
        if (!isNewWord) {
            chrome.runtime.sendMessage({ action: "updateWord", wordId: wordData.id, quality: 1 });
        }

        inputField.value = "";
        inputField.focus();
    }
}