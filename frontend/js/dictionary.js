document.addEventListener("DOMContentLoaded", () => {
  // Lấy thông tin từ localStorage
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const username = localStorage.getItem("username") || "";
  const navLoginBtn = document.getElementById("navLoginBtn");
  const userMenu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameSpan = document.querySelector(".user-profile-btn span:first-of-type");

  // Base URL cho API
  const API_BASE_URL = "http://localhost:5000/api";

  // Xử lý hiển thị đăng nhập / username
if (isLoggedIn && username) {
    if (navLoginBtn) navLoginBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "block";
    if (userNameSpan) userNameSpan.textContent = username;
    
    // Cập nhật avatar
    const avatar = document.querySelector(".user-profile-btn img");
    if (avatar) {
      avatar.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${username}`;
    }
  } else {
    if (navLoginBtn) navLoginBtn.style.display = "inline-block";
    if (userMenu) userMenu.style.display = "none";
  }

  // Xử lý logout - DÙNG onclick THAY VÌ addEventListener
  if (logoutBtn) {
    // Gỡ bỏ event listener cũ nếu có
    logoutBtn.onclick = null;
    
    // Gán event mới
    logoutBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Xóa tất cả dữ liệu đăng nhập
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      
      // Chuyển về trang chủ
      window.location.href = "index.html";
      
      return false;
    };
  }

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const welcomeState = document.getElementById("welcomeState");
  const resultState = document.getElementById("resultState");
  const audioBtn = document.getElementById("audioBtn");
  const wordTitle = document.getElementById("wordTitle");
  const wordPhonetic = document.getElementById("wordPhonetic");
  const wordTypes = document.getElementById("wordTypes");
  const wordMeaningsList = document.querySelector(".word-meanings ul");
  const wordExamplesContainer = document.querySelector(".word-examples");

  // Ẩn nút lưu từ
  const saveWordBtn = document.getElementById("saveWordBtn");
  if (saveWordBtn) {
    saveWordBtn.style.display = "none";
  }

  // Xóa lịch sử tìm kiếm cũ nếu có
  localStorage.removeItem("searchHistory");

  // Tạo container cho gợi ý từ
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.id = "suggestions";
  suggestionsContainer.className = "suggestions-container";
  searchInput.parentNode.appendChild(suggestionsContainer);

  // Hàm lấy gợi ý từ API (chỉ lấy từ database, không lấy lịch sử)
  async function fetchSuggestions(keyword) {
    if (!keyword || keyword.length < 2) {
      suggestionsContainer.style.display = "none";
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dictionary/search?q=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      
      if (result.status === "success" && result.data.length > 0) {
        displaySuggestions(result.data, keyword);
      } else {
        suggestionsContainer.style.display = "none";
      }
    } catch (error) {
      console.error("Lỗi lấy gợi ý:", error);
      suggestionsContainer.style.display = "none";
    }
  }

  // Hiển thị danh sách gợi ý
  function displaySuggestions(words, keyword) {
    suggestionsContainer.innerHTML = "";
    
    words.forEach(word => {
      const suggestionItem = document.createElement("div");
      suggestionItem.className = "suggestion-item";
      
      const wordSpan = document.createElement("span");
      wordSpan.className = "suggestion-word";
      
      // Highlight từ khóa
      const regex = new RegExp(`(${keyword})`, 'gi');
      wordSpan.innerHTML = word.word.replace(regex, '<strong>$1</strong>');
      
      const phoneticSpan = document.createElement("span");
      phoneticSpan.className = "suggestion-phonetic";
      phoneticSpan.textContent = word.phonetic || "";
      
      suggestionItem.appendChild(wordSpan);
      suggestionItem.appendChild(phoneticSpan);
      
      suggestionItem.addEventListener("click", () => {
        searchInput.value = word.word;
        suggestionsContainer.style.display = "none";
        performSearch();
      });
      
      suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = "block";
  }

  // Hàm hiển thị loading
  function showLoading() {
    wordTitle.innerText = "Đang tra cứu...";
    wordPhonetic.innerText = "";
    wordTypes.innerHTML = "";
    if (wordMeaningsList) wordMeaningsList.innerHTML = "";
    if (wordExamplesContainer) {
      wordExamplesContainer.innerHTML = '<p class="ex-title">Ví dụ:</p>';
    }
    // Ẩn phần từ đồng nghĩa/trái nghĩa khi loading
    const synonymsSection = document.querySelector('.synonyms-section');
    const antonymsSection = document.querySelector('.antonyms-section');
    if (synonymsSection) synonymsSection.style.display = "none";
    if (antonymsSection) antonymsSection.style.display = "none";
    
    welcomeState.style.display = "none";
    resultState.style.display = "block";
  }

  // Hàm hiển thị lỗi
  function showError(message) {
    wordTitle.innerText = "Không tìm thấy từ";
    wordPhonetic.innerText = "";
    wordTypes.innerHTML = "";
    if (wordMeaningsList) {
      wordMeaningsList.innerHTML = `<li style="color: red;">${message}</li>`;
    }
    if (wordExamplesContainer) {
      wordExamplesContainer.innerHTML = '<p class="ex-title">Ví dụ:</p>';
    }
    // Ẩn phần từ đồng nghĩa/trái nghĩa khi lỗi
    const synonymsSection = document.querySelector('.synonyms-section');
    const antonymsSection = document.querySelector('.antonyms-section');
    if (synonymsSection) synonymsSection.style.display = "none";
    if (antonymsSection) antonymsSection.style.display = "none";
  }

  // Hàm xác định class cho loại từ
  function getTypeClass(partOfSpeech) {
    const typeMap = {
      noun: "noun",
      verb: "verb",
      adjective: "adj",
      adverb: "adv",
      pronoun: "pronoun",
      preposition: "prep",
      conjunction: "conj",
      interjection: "interj",
    };
    return typeMap[partOfSpeech.toLowerCase()] || "noun";
  }

  // Hàm chuyển đổi loại từ sang tiếng Việt
  function getVietnameseType(partOfSpeech) {
    const typeMap = {
      noun: "Danh từ",
      verb: "Động từ",
      adjective: "Tính từ",
      adverb: "Trạng từ",
      pronoun: "Đại từ",
      preposition: "Giới từ",
      conjunction: "Liên từ",
      interjection: "Thán từ",
    };
    return typeMap[partOfSpeech.toLowerCase()] || partOfSpeech;
  }

  // HÀM MỚI: Lấy từ đồng nghĩa và trái nghĩa
  async function fetchSynonymsAntonyms(word) {
    try {
      const response = await fetch(`${API_BASE_URL}/dictionary/synonyms/${encodeURIComponent(word)}`);
      const result = await response.json();
      
      if (result.status === "success") {
        return {
          synonyms: result.synonyms || [],
          antonyms: result.antonyms || []
        };
      }
      return { synonyms: [], antonyms: [] };
    } catch (error) {
      console.error("Lỗi lấy từ đồng nghĩa/trái nghĩa:", error);
      return { synonyms: [], antonyms: [] };
    }
  }

  // HÀM MỚI: Hiển thị từ đồng nghĩa và trái nghĩa
  async function displaySynonymsAntonyms(word) {
    const synonymsContainer = document.getElementById("synonymsContainer");
    const antonymsContainer = document.getElementById("antonymsContainer");
    const synonymsSection = document.querySelector('.synonyms-section');
    const antonymsSection = document.querySelector('.antonyms-section');
    
    if (!synonymsContainer || !antonymsContainer) return;
    
    const data = await fetchSynonymsAntonyms(word);
    
    // Hiển thị từ đồng nghĩa
    if (data.synonyms && data.synonyms.length > 0) {
      synonymsContainer.innerHTML = data.synonyms.map(syn => 
        `<span class="synonym-tag" onclick="window.searchWord('${syn}')">${syn}</span>`
      ).join('');
      if (synonymsSection) synonymsSection.style.display = "block";
    } else {
      synonymsContainer.innerHTML = '<span class="no-data">✨ Chưa có từ đồng nghĩa</span>';
      if (synonymsSection) synonymsSection.style.display = "block";
    }
    
    // Hiển thị từ trái nghĩa
    if (data.antonyms && data.antonyms.length > 0) {
      antonymsContainer.innerHTML = data.antonyms.map(ant => 
        `<span class="antonym-tag" onclick="window.searchWord('${ant}')">${ant}</span>`
      ).join('');
      if (antonymsSection) antonymsSection.style.display = "block";
    } else {
      antonymsContainer.innerHTML = '<span class="no-data">✨ Chưa có từ trái nghĩa</span>';
      if (antonymsSection) antonymsSection.style.display = "block";
    }
  }

  // Hàm tìm kiếm từ (gọi từ window để dùng trong onclick)
  window.searchWord = function(word) {
    searchInput.value = word;
    performSearch();
  };

  // Hàm hiển thị kết quả từ API (ĐÃ CẬP NHẬT)
  function displayWordData(data) {
    wordTitle.innerText = data.word;
    wordPhonetic.innerText = data.phonetic || "Không có phiên âm";

    wordTypes.innerHTML = "";
    if (wordMeaningsList) wordMeaningsList.innerHTML = "";
    if (wordExamplesContainer) {
      wordExamplesContainer.innerHTML = '<p class="ex-title">Ví dụ:</p>';
    }

    if (data.meanings && data.meanings.length > 0) {
      data.meanings.forEach((meaning) => {
        const badge = document.createElement("span");
        badge.className = `type-badge ${getTypeClass(meaning.partOfSpeech)}`;
        badge.innerText = getVietnameseType(meaning.partOfSpeech);
        wordTypes.appendChild(badge);

        if (meaning.definitions && meaning.definitions.length > 0) {
          meaning.definitions.forEach((def, index) => {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${def.definition}</strong>`;
            if (wordMeaningsList) wordMeaningsList.appendChild(li);

            if (def.example && wordExamplesContainer) {
              const exampleDiv = document.createElement("div");
              exampleDiv.className = "ex-item";
              exampleDiv.innerHTML = `
                <p class="en">📖 ${def.example}</p>
              `;
              wordExamplesContainer.appendChild(exampleDiv);
            }
          });
        }
      });
    } else {
      if (wordMeaningsList) {
        wordMeaningsList.innerHTML = "<li>Không có định nghĩa</li>";
      }
    }
    
    // GỌI HÀM HIỂN THỊ TỪ ĐỒNG NGHĨA/TRÁI NGHĨA
    displaySynonymsAntonyms(data.word);
  }

  // Hàm tra cứu từ
  async function performSearch() {
    const query = searchInput.value.trim();
    if (query === "") {
      alert("Vui lòng nhập từ cần tra cứu!");
      return;
    }

    showLoading();
    suggestionsContainer.style.display = "none";

    try {
      const response = await fetch(
        `${API_BASE_URL}/dictionary/lookup/${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.status === "success") {
          displayWordData(result.data);
          console.log(`Từ "${query}" được lấy từ: ${result.source}`);
        } else {
          showError(result.message || "Không tìm thấy từ này");
        }
      } else if (response.status === 404) {
        showError(`Không tìm thấy từ "${query}" trong từ điển`);
      } else {
        const error = await response.json();
        showError(error.message || "Có lỗi xảy ra khi tra cứu từ");
      }
    } catch (error) {
      console.error("Error:", error);
      showError(
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
      );
    }
  }

  // Xử lý sự kiện tìm kiếm
  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
  }
  
  if (searchInput) {
    // Xử lý gợi ý khi gõ
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.trim();
      
      if (keyword.length >= 2) {
          fetchSuggestions(keyword);
      } else {
        suggestionsContainer.style.display = "none";
      }
    });

    // Xử lý phím Enter
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        suggestionsContainer.style.display = "none";
        performSearch();
      }
    });

    // Đóng gợi ý khi click ra ngoài
    document.addEventListener("click", function (e) {
      if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = "none";
      }
    });
  }

  // Xử lý phát âm
  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const word = wordTitle.innerText;
      if (word && word !== "Đang tra cứu..." && word !== "Không tìm thấy từ") {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    });
  }
});