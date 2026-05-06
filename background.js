// Thiết lập mặc định 10 từ/ngày nếu đại nhân chưa cài đặt
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['dailyNewLimit'], (res) => {
        if (!res.dailyNewLimit) chrome.storage.local.set({dailyNewLimit: 10});
    });
});

chrome.alarms.create("checkVocab", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkVocab") triggerReview();
});

function triggerReview() {
    chrome.storage.local.get(['vocabList', 'dailyNewLimit', 'dailyCount', 'lastStudyDate'], function(result) {
        const vocabList = result.vocabList || [];
        const dailyLimit = result.dailyNewLimit || 10;
        let dailyCount = result.dailyCount || 0;
        let lastStudyDate = result.lastStudyDate || new Date().toDateString();

        // Kiểm tra xem đã sang ngày mới chưa, nếu sang thì reset biến đếm
        const today = new Date().toDateString();
        if (today !== lastStudyDate) {
            dailyCount = 0; 
            lastStudyDate = today;
            chrome.storage.local.set({dailyCount: 0, lastStudyDate: today});
        }

        const now = Date.now();
        
        // Chia làm 2 loại: Từ cũ đến hạn ôn & Từ mới tinh chưa học
        const dueReviews = vocabList.filter(w => w.repetitions > 0 && w.nextReview <= now);
        const newWords = vocabList.filter(w => w.repetitions === 0);

        let wordToReview = null;

        if (dueReviews.length > 0) {
            // Ưu tiên ôn lại các từ cũ đã đến hạn (chọn ngẫu nhiên 1 từ)
            wordToReview = dueReviews[Math.floor(Math.random() * dueReviews.length)];
        } else if (newWords.length > 0 && dailyCount < dailyLimit) {
            // Nếu không có từ cũ cần ôn, VÀ đại nhân vẫn còn lượt học từ mới hôm nay
            wordToReview = newWords[0]; 
        }

        if (wordToReview) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if(tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showPopup", 
                        wordData: wordToReview
                    });
                }
            });
        }
    });
}

// Bắt tin nhắn khi đại nhân trả lời xong
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateWord") {
        chrome.storage.local.get(['vocabList', 'dailyCount'], function(result) {
            let vocabList = result.vocabList || [];
            let dailyCount = result.dailyCount || 0;
            const wordIndex = vocabList.findIndex(w => w.id === request.wordId);
            
            if (wordIndex !== -1) {
                // Kiểm tra xem đây có phải là từ mới học lần đầu tiên không
                const isFirstTimeLearning = vocabList[wordIndex].repetitions === 0 && request.quality >= 3;
                
                // Cập nhật chỉ số SM-2 cường độ cao
                vocabList[wordIndex] = updateWordIntense(vocabList[wordIndex], request.quality);
                
                // Trừ đi 1 lượt từ mới trong ngày nếu học thành công
                if (isFirstTimeLearning) {
                    dailyCount++;
                    chrome.storage.local.set({ dailyCount: dailyCount });
                }

                chrome.storage.local.set({ vocabList: vocabList });
            }
        });
    }
});

// Thuật toán Spaced Repetition Cường Độ Cao (Tính bằng mili-giây)
function updateWordIntense(wordObj, quality) {
    const minInMs = 60 * 1000;
    const hourInMs = 60 * minInMs;
    const dayInMs = 24 * hourInMs;

    if (!wordObj.intervalMs) wordObj.intervalMs = 15 * minInMs; // Gán mặc định nếu chưa có

    if (quality >= 3) {
        if (wordObj.repetitions === 0) {
            wordObj.intervalMs = 15 * minInMs; // Lần 1: Nhắc lại sau 15 phút
        } else if (wordObj.repetitions === 1) {
            wordObj.intervalMs = 2 * hourInMs; // Lần 2: Nhắc lại sau 2 tiếng
        } else if (wordObj.repetitions === 2) {
            wordObj.intervalMs = 1 * dayInMs;  // Lần 3: Nhắc lại sau 1 ngày
        } else {
            // Từ lần 4 trở đi, tính theo ngày như bình thường
            wordObj.intervalMs = Math.round(wordObj.intervalMs * wordObj.easeFactor); 
        }
        wordObj.repetitions += 1;
    } else {
        // Nếu sai, phế tu vi về 0 và bắt ôn lại sau 15 phút
        wordObj.repetitions = 0;
        wordObj.intervalMs = 15 * minInMs; 
    }

    wordObj.easeFactor = wordObj.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (wordObj.easeFactor < 1.3) wordObj.easeFactor = 1.3;

    wordObj.nextReview = Date.now() + wordObj.intervalMs;
    return wordObj;
}