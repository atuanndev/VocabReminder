document.addEventListener('DOMContentLoaded', () => {
  const tabAdd = document.getElementById('tabAdd');
  const tabManage = document.getElementById('tabManage');
  const sectionAdd = document.getElementById('sectionAdd');
  const sectionManage = document.getElementById('sectionManage');

  chrome.storage.local.get(['dailyNewLimit'], (res) => {
    if (res.dailyNewLimit) document.getElementById('dailyLimitInput').value = res.dailyNewLimit;
  });

  document.getElementById('saveLimitBtn').addEventListener('click', () => {
    const limit = parseInt(document.getElementById('dailyLimitInput').value);
    if (limit > 0) {
      chrome.storage.local.set({dailyNewLimit: limit}, () => {
        const btn = document.getElementById('saveLimitBtn');
        btn.innerText = "Đã lưu!";
        setTimeout(() => btn.innerText = "Lưu", 1500);
      });
    }
  });

  tabAdd.addEventListener('click', () => {
    tabAdd.classList.add('active'); tabManage.classList.remove('active');
    sectionAdd.classList.add('active'); sectionManage.classList.remove('active');
  });

  tabManage.addEventListener('click', () => {
    tabManage.classList.add('active'); tabAdd.classList.remove('active');
    sectionManage.classList.add('active'); sectionAdd.classList.remove('active');
    loadWordList();
  });

  // Thêm từ thủ công có chứa Từ loại
  document.getElementById('addBtn').addEventListener('click', () => {
    const word = document.getElementById('word').value.trim();
    const wordType = document.getElementById('wordType').value.trim(); // Nhận từ loại
    const meaning = document.getElementById('meaning').value.trim();
    
    if (!word || !meaning) { document.getElementById('status').innerText = "Thiếu khẩu quyết!"; return; }

    chrome.storage.local.get(['vocabList'], (result) => {
      const vocabList = result.vocabList || [];
      vocabList.push({
        id: Date.now().toString(), word: word, type: wordType, meaning: meaning,
        repetitions: 0, easeFactor: 2.5, intervalMs: 0, nextReview: Date.now()
      });
      chrome.storage.local.set({ vocabList: vocabList }, () => {
        document.getElementById('status').innerText = "Đã luyện hóa!";
        document.getElementById('word').value = ''; 
        document.getElementById('wordType').value = ''; 
        document.getElementById('meaning').value = '';
        setTimeout(() => { document.getElementById('status').innerText = ''; }, 2000);
      });
    });
  });

  function loadWordList() {
    const container = document.getElementById('wordListContainer');
    container.innerHTML = '';
    chrome.storage.local.get(['vocabList', 'dailyCount', 'dailyNewLimit'], (result) => {
      const vocabList = result.vocabList || [];
      const count = result.dailyCount || 0;
      const limit = result.dailyNewLimit || 10;
      
      const headerInfo = document.createElement('div');
      headerInfo.innerHTML = `<div style="text-align:center; margin-bottom: 10px; color:#2e7d32; font-weight:bold;">Đã học hôm nay: ${count}/${limit} từ mới</div>`;
      container.appendChild(headerInfo);

      if(vocabList.length === 0) {
        container.innerHTML += '<div style="text-align:center; color: #8b0000;">Trống rỗng.</div>'; return;
      }

      vocabList.forEach(wordObj => {
        let realm = "Luyện Khí";
        if (wordObj.repetitions >= 2) realm = "Trúc Cơ";
        if (wordObj.repetitions >= 4) realm = "Kim Đan";
        if (wordObj.repetitions >= 6) realm = "Nguyên Anh";

        // Chuẩn bị chuỗi từ loại để hiển thị nếu có
        const typeStr = wordObj.type ? ` <span style="color:#555; font-style:italic;">${wordObj.type}</span>` : '';

        const item = document.createElement('div');
        item.className = 'word-item';
        item.innerHTML = `
          <div class="word-info">
            <div class="word-title">${wordObj.word}${typeStr} = ${wordObj.meaning}</div>
            <div class="word-realm">${realm} (Đã ôn: ${wordObj.repetitions} lần)</div>
          </div>
          <button class="delete-btn" data-id="${wordObj.id}">Phế</button>
        `;
        container.appendChild(item);
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          let newList = vocabList.filter(w => w.id !== id);
          chrome.storage.local.set({ vocabList: newList }, () => loadWordList());
        });
      });
    });
  }

  // Import JSON có đọc thêm Thuộc tính (type)
  document.getElementById('importFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        chrome.storage.local.get(['vocabList'], (result) => {
          const vocabList = result.vocabList || [];
          let count = 0;
          importedData.forEach(item => {
            if (item.word && item.meaning) {
              vocabList.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                word: item.word.trim(), 
                type: item.type ? item.type.trim() : "", // Lấy từ loại nếu ngọc giản có ghi
                meaning: item.meaning.trim(),
                repetitions: 0, easeFactor: 2.5, intervalMs: 0, nextReview: Date.now()
              });
              count++;
            }
          });
          chrome.storage.local.set({ vocabList: vocabList }, () => {
            document.getElementById('importStatus').style.color = "#2e7d32";
            document.getElementById('importStatus').innerText = `Hấp thu ${count} khẩu quyết!`;
            document.getElementById('importFile').value = '';
            setTimeout(() => { document.getElementById('importStatus').innerText = ''; }, 3000);
          });
        });
      } catch (err) {
        document.getElementById('importStatus').style.color = "#d32f2f";
        document.getElementById('importStatus').innerText = "Lỗi định dạng file!";
      }
    };
    reader.readAsText(file);
  });
});