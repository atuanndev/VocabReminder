chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['dailyNewLimit', 'isActive'], (res) => {
        if (!res.dailyNewLimit) chrome.storage.local.set({dailyNewLimit: 10});
        if (res.isActive === undefined) chrome.storage.local.set({isActive: true}); // Mặc định là bật
    });
});

chrome.alarms.create("checkVocab", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkVocab") triggerReview();
});

function triggerReview() {
    chrome.storage.local.get(['isActive', 'vocabList', 'dailyNewLimit', 'dailyCount', 'lastStudyDate'], function(result) {
        // KIỂM TRA LỆNH BÀI: Nếu đang "Bế Quan" (isActive = false) thì lui binh ngay lập tức
        if (result.isActive === false) return; 

        const vocabList = result.vocabList || [];
        const dailyLimit = result.dailyNewLimit || 10;
        let dailyCount = result.dailyCount || 0;
        let lastStudyDate = result.lastStudyDate || new Date().toDateString();

        const today = new Date().toDateString();
        if (today !== lastStudyDate) {
            dailyCount = 0; 
            lastStudyDate = today;
            chrome.storage.local.set({dailyCount: 0, lastStudyDate: today});
        }

        const now = Date.now();
        const dueReviews = vocabList.filter(w => w.repetitions > 0 && w.nextReview <= now);
        const newWords = vocabList.filter(w => w.repetitions === 0);

        let wordToReview = null;

        if (dueReviews.length > 0) {
            wordToReview = dueReviews[Math.floor(Math.random() * dueReviews.length)];
        } else if (newWords.length > 0 && dailyCount < dailyLimit) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateWord") {
        chrome.storage.local.get(['vocabList', 'dailyCount'], function(result) {
            let vocabList = result.vocabList || [];
            let dailyCount = result.dailyCount || 0;
            const wordIndex = vocabList.findIndex(w => w.id === request.wordId);
            
            if (wordIndex !== -1) {
                const isFirstTimeLearning = vocabList[wordIndex].repetitions === 0 && request.quality >= 3;
                
                vocabList[wordIndex] = updateWordIntense(vocabList[wordIndex], request.quality);
                
                if (isFirstTimeLearning) {
                    dailyCount++;
                    chrome.storage.local.set({ dailyCount: dailyCount });
                }

                chrome.storage.local.set({ vocabList: vocabList });
            }
        });
    }
});

function updateWordIntense(wordObj, quality) {
    const minInMs = 60 * 1000;
    const hourInMs = 60 * minInMs;
    const dayInMs = 24 * hourInMs;

    if (!wordObj.intervalMs) wordObj.intervalMs = 15 * minInMs;

    if (quality >= 3) {
        if (wordObj.repetitions === 0) {
            wordObj.intervalMs = 15 * minInMs; 
        } else if (wordObj.repetitions === 1) {
            wordObj.intervalMs = 2 * hourInMs; 
        } else if (wordObj.repetitions === 2) {
            wordObj.intervalMs = 1 * dayInMs;  
        } else {
            wordObj.intervalMs = Math.round(wordObj.intervalMs * wordObj.easeFactor); 
        }
        wordObj.repetitions += 1;
    } else {
        wordObj.repetitions = 0;
        wordObj.intervalMs = 15 * minInMs; 
    }

    wordObj.easeFactor = wordObj.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (wordObj.easeFactor < 1.3) wordObj.easeFactor = 1.3;

    wordObj.nextReview = Date.now() + wordObj.intervalMs;
    return wordObj;
}