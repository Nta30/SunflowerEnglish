import {initApp} from "./core.js"
const defaultDecks = [
  {
    id: 1,
    title: "Từ vựng TOEIC Part 1",
    description: "Bộ từ cơ bản để luyện mô tả tranh và hành động.",
    icon: "🪴",
    cards: [
      {
        id: 101,
        front: "Appreciate",
        back: "Đánh giá cao, cảm kích",
        phonetic: "/əˈpriː.ʃi.eɪt/",
        example: "I really appreciate your help.",
      },
      {
        id: 102,
        front: "Sunflower",
        back: "Hoa hướng dương",
        phonetic: "/ˈsʌnˌflaʊ.ər/",
        example: "The sunflower always turns towards the sun.",
      },
    ],
  },
  {
    id: 2,
    title: "Từ vựng Giao tiếp",
    description: "Các từ thông dụng dùng trong hội thoại hằng ngày.",
    icon: "🌻",
    cards: [
      {
        id: 201,
        front: "Awesome",
        back: "Tuyệt vời",
        phonetic: "/ˈɔː.səm/",
        example: "You did an awesome job!",
      },
    ],
  },
];

document.addEventListener("DOMContentLoaded",async () => {
  await initApp()
  const logoutBtn = document.getElementById("logoutBtn");

  const deckListView = document.getElementById("deckListView");
  const deckDetailView = document.getElementById("deckDetailView");
  const reviewView = document.getElementById("reviewView");

  const deckGrid = document.getElementById("deckGrid");
  const cardGrid = document.getElementById("cardGrid");
  const emptyCardBox = document.getElementById("emptyCardBox");

  const detailDeckTitle = document.getElementById("detailDeckTitle");
  const detailDeckDescription = document.getElementById("detailDeckDescription");
  const detailCardCount = document.getElementById("detailCardCount");

  const createNewDeckBtn = document.getElementById("createNewDeckBtn");
  const backToDeckListBtn = document.getElementById("backToDeckListBtn");
  const openAddCardModalBtn = document.getElementById("openAddCardModalBtn");
  const startReviewBtn = document.getElementById("startReviewBtn");

  const createDeckModal = document.getElementById("createDeckModal");
  const closeCreateDeckModalBtn = document.getElementById("closeCreateDeckModalBtn");
  const cancelCreateDeckBtn = document.getElementById("cancelCreateDeckBtn");
  const createDeckForm = document.getElementById("createDeckForm");

  const deckTitleInput = document.getElementById("deckTitleInput");
  const deckDescriptionInput = document.getElementById("deckDescriptionInput");
  const deckIconOptions = document.querySelectorAll("#deckIconPicker .icon-option");

  const previewDeckIcon = document.getElementById("previewDeckIcon");
  const previewDeckTitle = document.getElementById("previewDeckTitle");
  const previewDeckDescription = document.getElementById("previewDeckDescription");

  const addCardModal = document.getElementById("addCardModal");
  const addCardModalTitle = document.getElementById("addCardModalTitle");
  const addCardSubmitBtn = document.getElementById("addCardSubmitBtn");
  const closeAddCardModalBtn = document.getElementById("closeAddCardModalBtn");
  const cancelAddCardBtn = document.getElementById("cancelAddCardBtn");
  const addCardForm = document.getElementById("addCardForm");

  const cardFrontInput = document.getElementById("cardFrontInput");
  const cardBackInput = document.getElementById("cardBackInput");
  const cardPhoneticInput = document.getElementById("cardPhoneticInput");
  const cardExampleInput = document.getElementById("cardExampleInput");

  const closeReviewBtn = document.getElementById("closeReviewBtn");
  const reviewDeckTitle = document.getElementById("reviewDeckTitle");
  const reviewProgress = document.getElementById("reviewProgress");
  const reviewCard = document.getElementById("reviewCard");
  const reviewFrontText = document.getElementById("reviewFrontText");
  const reviewBackText = document.getElementById("reviewBackText");
  const reviewPhoneticText = document.getElementById("reviewPhoneticText");
  const reviewExampleText = document.getElementById("reviewExampleText");
  const prevReviewBtn = document.getElementById("prevReviewBtn");
  const flipReviewBtn = document.getElementById("flipReviewBtn");
  const nextReviewBtn = document.getElementById("nextReviewBtn");

  let deckList = [];
  let selectedDeckIcon = "🌱";
  let currentDeckId = null;
  let editingCardId = null;
  let editingDeckId = null;

  let currentReviewIndex = 0;
  let isReviewCardFlipped = false;

  function initializeApp() {
    setupLogout();
    loadDecksFromStorage();
    renderDecks();
    bindEvents();
  }

  function setupLogout() {
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }

  function loadDecksFromStorage() {
    const savedDecks = localStorage.getItem("sunflower_flashcard_decks");

    try {
      if (savedDecks) {
        deckList = JSON.parse(savedDecks);
      } else {
        deckList = JSON.parse(JSON.stringify(defaultDecks));
        saveDecksToStorage();
      }
    } catch (error) {
      deckList = JSON.parse(JSON.stringify(defaultDecks));
      saveDecksToStorage();
    }
  }

  function saveDecksToStorage() {
    localStorage.setItem("sunflower_flashcard_decks", JSON.stringify(deckList));
  }

  function bindEvents() {
    createNewDeckBtn.addEventListener("click", openCreateDeckModal);
    closeCreateDeckModalBtn.addEventListener("click", closeCreateDeckModal);
    cancelCreateDeckBtn.addEventListener("click", closeCreateDeckModal);

    createDeckModal.addEventListener("click", (event) => {
      if (event.target === createDeckModal) {
        closeCreateDeckModal();
      }
    });

    deckTitleInput.addEventListener("input", updateDeckPreview);
    deckDescriptionInput.addEventListener("input", updateDeckPreview);

    deckIconOptions.forEach((iconButton) => {
      iconButton.addEventListener("click", () => {
        selectDeckIcon(iconButton.dataset.icon);
      });
    });

    createDeckForm.addEventListener("submit", (event) => {
      event.preventDefault();
      createDeck();
    });

    backToDeckListBtn.addEventListener("click", showDeckListView);
    openAddCardModalBtn.addEventListener("click", openAddCardModal);
    startReviewBtn.addEventListener("click", openReviewMode);

    closeAddCardModalBtn.addEventListener("click", closeAddCardModal);
    cancelAddCardBtn.addEventListener("click", closeAddCardModal);

    addCardModal.addEventListener("click", (event) => {
      if (event.target === addCardModal) {
        closeAddCardModal();
      }
    });

    addCardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCard();
    });
    document.addEventListener("click", () => {
      document.querySelectorAll(".deck-dropdown.show").forEach((menu) => {
      menu.classList.remove("show");
      });
    });

    closeReviewBtn.addEventListener("click", showDeckDetailView);
    reviewCard.addEventListener("click", toggleReviewCard);
    flipReviewBtn.addEventListener("click", toggleReviewCard);
    prevReviewBtn.addEventListener("click", showPreviousReviewCard);
    nextReviewBtn.addEventListener("click", showNextReviewCard);
  }

  function renderDecks() {
    deckGrid.innerHTML = "";

    if (deckList.length === 0) {
      deckGrid.innerHTML = `
        <div class="empty-card-box">
          <div class="empty-card-icon">🌱</div>
          <h3>Chưa có bộ từ nào</h3>
          <p>Hãy bấm "Gieo hạt mới" để tạo bộ từ đầu tiên của bạn.</p>
        </div>
      `;
      return;
  }

    deckList.forEach((deck) => {
      const deckCard = document.createElement("div");
      deckCard.className = "deck-card";

      deckCard.innerHTML = `
        <div class="deck-menu">
          <button class="deck-menu-btn" type="button" title="Tùy chọn">⋯</button>

          <div class="deck-dropdown">
            <button class="deck-dropdown-item edit-deck-btn" type="button">🖋️ Sửa</button>
            <button class="deck-dropdown-item delete-deck-btn" type="button">❌ Xóa</button>
          </div>
        </div>

        <div class="deck-icon">${deck.icon}</div>
        <h3 class="deck-title">${deck.title}</h3>
        <p class="deck-description">${deck.description || "Chưa có mô tả cho bộ từ này."}</p>
        <span class="deck-stats">${deck.cards.length} thẻ</span>
      `;

      const deckMenuBtn = deckCard.querySelector(".deck-menu-btn");
      const deckDropdown = deckCard.querySelector(".deck-dropdown");
      const editDeckBtn = deckCard.querySelector(".edit-deck-btn");
      const deleteDeckBtn = deckCard.querySelector(".delete-deck-btn");

      deckMenuBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        document.querySelectorAll(".deck-dropdown.show").forEach((menu) => {
          if (menu !== deckDropdown) {
            menu.classList.remove("show");
          }
        });

        deckDropdown.classList.toggle("show");
      });

      editDeckBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deckDropdown.classList.remove("show");
        openEditDeckModal(deck.id);
      });

      deleteDeckBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deckDropdown.classList.remove("show");
        deleteDeck(deck.id);
      });

      deckCard.addEventListener("click", () => {
        openDeckDetail(deck.id);
      });

      deckGrid.appendChild(deckCard);
    });
  }

  function openDeckDetail(deckId) {
    currentDeckId = deckId;
    updateDeckDetail();
    showDeckDetailView();
  }
  function openEditDeckModal(deckId) {
    const deck = deckList.find((item) => item.id === deckId);
      if (!deck) return;

    editingDeckId = deckId;

    document.querySelector("#createDeckModal .modal-header h2").innerText = "Chỉnh sửa bộ từ 🖋️";
    document.querySelector("#createDeckForm .btn-primary").innerText = "Lưu thay đổi";

    deckTitleInput.value = deck.title || "";
    deckDescriptionInput.value = deck.description || "";
    selectedDeckIcon = deck.icon || "🌱";

    deckIconOptions.forEach((iconButton) => {
      if (iconButton.dataset.icon === selectedDeckIcon) {
        iconButton.classList.add("active");
      } else {
        iconButton.classList.remove("active");
      }
    });
  }

  updateDeckPreview();

  function updateDeckDetail() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    detailDeckTitle.innerText = currentDeck.title;
    detailDeckDescription.innerText =
      currentDeck.description || "Chưa có mô tả cho bộ từ này.";
    detailCardCount.innerText = `${currentDeck.cards.length} thẻ`;

    renderCardsOfCurrentDeck();
  }

  function showDeckListView() {
    deckListView.style.display = "block";
    deckDetailView.style.display = "none";
    reviewView.style.display = "none";
    currentDeckId = null;
  }

  function showDeckDetailView() {
    deckListView.style.display = "none";
    deckDetailView.style.display = "block";
    reviewView.style.display = "none";
    updateDeckDetail();
  }

  function renderCardsOfCurrentDeck() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    cardGrid.innerHTML = "";
    detailCardCount.innerText = `${currentDeck.cards.length} thẻ`;

    if (currentDeck.cards.length === 0) {
      emptyCardBox.style.display = "block";
      cardGrid.style.display = "none";
      return;
    }

    emptyCardBox.style.display = "none";
    cardGrid.style.display = "grid";

    currentDeck.cards.forEach((card) => {
      const cardItem = document.createElement("div");
      cardItem.className = "flip-card";

      cardItem.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="card-actions">
                <button class="card-action-btn edit-card-btn" type="button" title="Sửa thẻ">🖋️</button>
                <button class="card-action-btn delete-card-btn" type="button" title="Xóa thẻ">❌</button>
            </div>

            <h3>${escapeHtml(card.front)}</h3>
            <p class="card-hint">Click để lật thẻ 👆</p>
          </div>

          <div class="flip-card-back">
            <div class="card-actions">
              <button class="card-action-btn edit-card-btn" type="button" title="Sửa thẻ">🖋️</button>
              <button class="card-action-btn delete-card-btn" type="button" title="Xóa thẻ">❌</button>
            </div>

            <h3>${escapeHtml(card.back)}</h3>
            <p class="card-phonetic">${card.phonetic ? escapeHtml(card.phonetic) : ""}</p>
            <p class="card-example">${card.example ? escapeHtml(card.example) : ""}</p>
          </div>
        </div>
      `;

      const editBtns = cardItem.querySelectorAll(".edit-card-btn");
      const deleteBtns = cardItem.querySelectorAll(".delete-card-btn");

      editBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          openEditCardModal(card.id);
        });
      });

      deleteBtns.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          deleteCard(card.id);
        });
      });

      cardItem.addEventListener("click", () => {
        cardItem.classList.toggle("is-flipped");
      });

      cardGrid.appendChild(cardItem);
    });
  }

  function openCreateDeckModal() {
    editingDeckId = null;
    document.querySelector("#createDeckModal .modal-header h2").innerText = "Tạo bộ từ mới 🌱";
    document.querySelector("#createDeckForm .btn-primary").innerText = "Tạo bộ từ";
    resetCreateDeckForm();
    createDeckModal.classList.add("show");
    deckTitleInput.focus();
  }

  function closeCreateDeckModal() {
    createDeckModal.classList.remove("show");
    resetCreateDeckForm();
    editingDeckId = null;
    document.querySelector("#createDeckModal .modal-header h2").innerText = "Tạo bộ từ mới 🌱";
    document.querySelector("#createDeckForm .btn-primary").innerText = "Tạo bộ từ";
  }

  function resetCreateDeckForm() {
    createDeckForm.reset();
    selectedDeckIcon = "🌱";
    previewDeckIcon.innerText = "🌱";
    previewDeckTitle.innerText = "Tên bộ từ của bạn";
    previewDeckDescription.innerText = "Mô tả của bộ từ sẽ hiển thị ở đây.";

    deckIconOptions.forEach((iconButton) => {
      iconButton.classList.remove("active");
      if (iconButton.dataset.icon === "🌱") {
        iconButton.classList.add("active");
      }
    });
  }

  function updateDeckPreview() {
    const deckTitleValue = deckTitleInput.value.trim();
    const deckDescriptionValue = deckDescriptionInput.value.trim();

    previewDeckTitle.innerText =
      deckTitleValue === "" ? "Tên bộ từ của bạn" : deckTitleValue;

    previewDeckDescription.innerText =
      deckDescriptionValue === ""
        ? "Mô tả của bộ từ sẽ hiển thị ở đây."
        : deckDescriptionValue;

    previewDeckIcon.innerText = selectedDeckIcon;
  }

  function selectDeckIcon(iconValue) {
    selectedDeckIcon = iconValue;

    deckIconOptions.forEach((iconButton) => {
      if (iconButton.dataset.icon === iconValue) {
        iconButton.classList.add("active");
      } else {
        iconButton.classList.remove("active");
      }
    });

    updateDeckPreview();
  }

  function createDeck() {
    const deckTitleValue = deckTitleInput.value.trim();
    const deckDescriptionValue = deckDescriptionInput.value.trim();

    if (deckTitleValue === "") {
      alert("Vui lòng nhập tên bộ từ.");
      deckTitleInput.focus();
      return;
    }

    if (editingDeckId === null){
      const newDeck = {
        id: Date.now(),
        title: deckTitleValue,
        description: deckDescriptionValue,
        icon: selectedDeckIcon,
        cards: [],
      };
      deckList.unshift(newDeck);
    }else{
      const deckIndex = deckList.findIndex((deck) => deck.id === editingDeckId);
      if (deckIndex !== -1) {
        deckList[deckIndex] = {
        ...deckList[deckIndex],
        title: deckTitleValue,
        description: deckDescriptionValue,
        icon: selectedDeckIcon,
        };
      }
    }
    saveDecksToStorage();
    renderDecks();

    if (currentDeckId === editingDeckId) {
      updateDeckDetail();
    }

    closeCreateDeckModal();

  }
  function deleteDeck(deckId) {
    const deck = deckList.find((item) => item.id === deckId);
    if (!deck) return;

    const confirmDelete = window.confirm(`Bạn có chắc muốn xóa bộ từ "${deck.title}" không?`);
    if (!confirmDelete) return;

    deckList = deckList.filter((item) => item.id !== deckId);

    saveDecksToStorage();
    renderDecks();

    if (currentDeckId === deckId) {
      showDeckListView();
    }
  }

  function openAddCardModal() {
    if (!currentDeckId) return;

    editingCardId = null;
    addCardModalTitle.innerText = "Thêm từ mới ✨";
    addCardSubmitBtn.innerText = "Lưu từ mới";
    resetAddCardForm();

    addCardModal.classList.add("show");
    cardFrontInput.focus();
  }

  function openEditCardModal(cardId) {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    const card = currentDeck.cards.find((item) => item.id === cardId);
    if (!card) return;

    editingCardId = cardId;
    addCardModalTitle.innerText = "Chỉnh sửa thẻ 🖋️";
    addCardSubmitBtn.innerText = "Lưu thay đổi";

    cardFrontInput.value = card.front || "";
    cardBackInput.value = card.back || "";
    cardPhoneticInput.value = card.phonetic || "";
    cardExampleInput.value = card.example || "";

    addCardModal.classList.add("show");
    cardFrontInput.focus();
  }

  function closeAddCardModal() {
    addCardModal.classList.remove("show");
    resetAddCardForm();
    editingCardId = null;
    addCardModalTitle.innerText = "Thêm từ mới ✨";
    addCardSubmitBtn.innerText = "Lưu từ mới";
  }

  function resetAddCardForm() {
    addCardForm.reset();
  }

  function saveCard() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    const frontValue = cardFrontInput.value.trim();
    const backValue = cardBackInput.value.trim();
    const phoneticValue = cardPhoneticInput.value.trim();
    const exampleValue = cardExampleInput.value.trim();

    if (frontValue === "") {
      alert("Vui lòng nhập mặt trước của thẻ.");
      cardFrontInput.focus();
      return;
    }

    if (backValue === "") {
      alert("Vui lòng nhập mặt sau của thẻ.");
      cardBackInput.focus();
      return;
    }

    if (editingCardId === null) {
      const newCard = {
        id: Date.now(),
        front: frontValue,
        back: backValue,
        phonetic: phoneticValue,
        example: exampleValue,
      };

      currentDeck.cards.unshift(newCard);
    } else {
      const cardIndex = currentDeck.cards.findIndex((card) => card.id === editingCardId);

      if (cardIndex !== -1) {
        currentDeck.cards[cardIndex] = {
          ...currentDeck.cards[cardIndex],
          front: frontValue,
          back: backValue,
          phonetic: phoneticValue,
          example: exampleValue,
        };
      }
    }

    saveDecksToStorage();
    renderDecks();
    renderCardsOfCurrentDeck();
    closeAddCardModal();
  }

  function deleteCard(cardId) {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    const confirmDelete = window.confirm("Bạn có chắc muốn xóa thẻ này không?");
    if (!confirmDelete) return;

    currentDeck.cards = currentDeck.cards.filter((card) => card.id !== cardId);

    saveDecksToStorage();
    renderDecks();
    renderCardsOfCurrentDeck();
  }

  function openReviewMode() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    if (currentDeck.cards.length === 0) {
      alert("Bộ từ này chưa có thẻ để ôn tập.");
      return;
    }

    currentReviewIndex = 0;
    isReviewCardFlipped = false;

    deckListView.style.display = "none";
    deckDetailView.style.display = "none";
    reviewView.style.display = "block";

    renderReviewCard();
  }

  function renderReviewCard() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck || currentDeck.cards.length === 0) return;

    const currentCard = currentDeck.cards[currentReviewIndex];
    if (!currentCard) return;

    reviewDeckTitle.innerText = currentDeck.title;
    reviewProgress.innerText = `${currentReviewIndex + 1} / ${currentDeck.cards.length}`;

    reviewFrontText.innerText = currentCard.front || "";
    reviewBackText.innerText = currentCard.back || "";
    reviewPhoneticText.innerText = currentCard.phonetic || "";
    reviewExampleText.innerText = currentCard.example || "";

    reviewCard.classList.toggle("is-flipped", isReviewCardFlipped);

    prevReviewBtn.disabled = currentReviewIndex === 0;
    nextReviewBtn.disabled = currentReviewIndex === currentDeck.cards.length - 1;
  }

  function toggleReviewCard() {
    isReviewCardFlipped = !isReviewCardFlipped;
    reviewCard.classList.toggle("is-flipped", isReviewCardFlipped);
  }

  function showPreviousReviewCard() {
    if (currentReviewIndex === 0) return;

    currentReviewIndex -= 1;
    isReviewCardFlipped = false;
    renderReviewCard();
  }

  function showNextReviewCard() {
    const currentDeck = getCurrentDeck();
    if (!currentDeck) return;

    if (currentReviewIndex >= currentDeck.cards.length - 1) return;

    currentReviewIndex += 1;
    isReviewCardFlipped = false;
    renderReviewCard();
  }

  function getCurrentDeck() {
    return deckList.find((deck) => deck.id === currentDeckId);
  }

  function escapeHtml(text) {
    const tempDiv = document.createElement("div");
    tempDiv.innerText = text;
    return tempDiv.innerHTML;
  }

  initializeApp();
});