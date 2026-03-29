const defaultDecks = [
  {
    id: 1,
    title: "Từ vựng TOEIC Part 1",
    icon: "🪴",
    cards: [
      {
        front: "Appreciate",
        back: "Đánh giá cao, cảm kích",
        phonetic: "/əˈpriː.ʃi.eɪt/",
        example: "I really appreciate your help.",
      },
      {
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
    icon: "🌻",
    cards: [
      {
        front: "Cute",
        back: "Dễ thương",
        phonetic: "/kjuːt/",
        example: "That's a very cute puppy.",
      },
      {
        front: "Awesome",
        back: "Tuyệt vời",
        phonetic: "/ˈɔː.səm/",
        example: "You did an awesome job!",
      },
    ],
  },
];

let myDecks = [];

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const savedDecks = localStorage.getItem("sunflowerDecks");
  if (savedDecks) {
    myDecks = JSON.parse(savedDecks);
  } else {
    myDecks = defaultDecks;
    saveDecks();
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }

  const deckListView = document.getElementById("deckListView");
  const deckDetailView = document.getElementById("deckDetailView");
  const studyView = document.getElementById("studyView");
  const deckGrid = document.getElementById("deckGrid");
  const cardList = document.getElementById("cardList");

  const detailDeckIcon = document.getElementById("detailDeckIcon");
  const detailDeckTitle = document.getElementById("detailDeckTitle");

  const studyCard = document.getElementById("studyCard");
  const frontWord = document.getElementById("frontWord");
  const backWord = document.getElementById("backWord");
  const backPhonetic = document.getElementById("backPhonetic");
  const backExample = document.getElementById("backExample");
  const studyProgress = document.getElementById("studyProgress");
  const currentDeckTitle = document.getElementById("currentDeckTitle");

  const newDeckModal = document.getElementById("newDeckModal");
  const newCardModal = document.getElementById("newCardModal");
  const createNewDeckBtn = document.getElementById("createNewDeckBtn");
  const openNewDeckModalBtn = document.getElementById("openNewDeckModalBtn");

  let activeDeckId = null;
  let currentCardIndex = 0;

  function saveDecks() {
    localStorage.setItem("sunflowerDecks", JSON.stringify(myDecks));
  }

  function renderDecks() {
    deckGrid.innerHTML = "";
    myDecks.forEach((deck) => {
      const deckCard = document.createElement("div");
      deckCard.className = "deck-card";
      deckCard.innerHTML = `
        <div class="deck-icon">${deck.icon}</div>
        <h3 class="deck-title">${deck.title}</h3>
        <span class="deck-stats">${deck.cards.length} thẻ</span>
      `;
      deckCard.addEventListener("click", () => openDeckDetail(deck.id));
      deckGrid.appendChild(deckCard);
    });
  }

  function openDeckDetail(deckId) {
    activeDeckId = deckId;
    const deck = myDecks.find((d) => d.id === deckId);

    deckListView.style.display = "none";
    studyView.style.display = "none";
    deckDetailView.style.display = "block";

    detailDeckIcon.innerText = deck.icon;
    detailDeckTitle.innerText = deck.title;

    renderCardList(deck);
  }

  function renderCardList(deck) {
    cardList.innerHTML = "";
    if (deck.cards.length === 0) {
      cardList.innerHTML = `<div class="empty-deck-msg">Chậu cây này chưa có hạt giống nào. Hãy thêm từ mới nhé! 🌱</div>`;
      return;
    }

    deck.cards.forEach((card) => {
      const item = document.createElement("div");
      item.className = "card-list-item";
      item.innerHTML = `
        <div class="card-word">${card.front}</div>
        <div class="card-meaning">${card.back}</div>
        <div class="card-extra">${card.phonetic || ""} ${card.example ? "- " + card.example : ""}</div>
      `;
      cardList.appendChild(item);
    });
  }

  function startStudy() {
    const deck = myDecks.find((d) => d.id === activeDeckId);
    if (deck.cards.length === 0) {
      alert("Bạn cần thêm ít nhất 1 từ vựng để bắt đầu học nhé!");
      return;
    }

    currentCardIndex = 0;
    deckDetailView.style.display = "none";
    studyView.style.display = "block";
    currentDeckTitle.innerText = `Đang học: ${deck.title}`;
    loadCard();
  }

  function loadCard() {
    const deck = myDecks.find((d) => d.id === activeDeckId);

    if (currentCardIndex >= deck.cards.length) {
      alert(
        "Tuyệt vời! Bạn đã hoàn thành việc tưới nước cho vườn từ vựng này. 🌱",
      );
      openDeckDetail(activeDeckId);
      return;
    }

    const card = deck.cards[currentCardIndex];
    studyCard.classList.remove("is-flipped");

    setTimeout(() => {
      frontWord.innerText = card.front;
      backWord.innerText = card.back;
      backPhonetic.innerText = card.phonetic || "";
      backExample.innerText = card.example || "";
      studyProgress.innerText = `${currentCardIndex + 1}/${deck.cards.length}`;
    }, 150);
  }

  studyCard.addEventListener("click", () => {
    studyCard.classList.toggle("is-flipped");
  });

  document.getElementById("btnForget").addEventListener("click", () => {
    currentCardIndex++;
    loadCard();
  });

  document.getElementById("btnHard").addEventListener("click", () => {
    currentCardIndex++;
    loadCard();
  });

  document.getElementById("btnEasy").addEventListener("click", () => {
    currentCardIndex++;
    loadCard();
  });

  document.getElementById("backFromDetailBtn").addEventListener("click", () => {
    deckDetailView.style.display = "none";
    deckListView.style.display = "block";
    renderDecks();
  });

  document.getElementById("backToDetailBtn").addEventListener("click", () => {
    openDeckDetail(activeDeckId);
  });

  document
    .getElementById("startStudyBtn")
    .addEventListener("click", startStudy);

  if (createNewDeckBtn) {
    createNewDeckBtn.addEventListener("click", () => {
      document.getElementById("deckTitleInput").value = "";
      document.getElementById("deckIconInput").value = "🪴";
      newDeckModal.classList.add("active");
    });
  }

  if (openNewDeckModalBtn) {
    openNewDeckModalBtn.addEventListener("click", () => {
      document.getElementById("deckTitleInput").value = "";
      document.getElementById("deckIconInput").value = "🪴";
      newDeckModal.classList.add("active");
    });
  }

  document.getElementById("closeDeckModalBtn").addEventListener("click", () => {
    newDeckModal.classList.remove("active");
  });

  document.getElementById("newDeckForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("deckTitleInput").value.trim();
    const icon = document.getElementById("deckIconInput").value.trim() || "🪴";

    const newDeck = {
      id: Date.now(),
      title: title,
      icon: icon,
      cards: [],
    };

    myDecks.push(newDeck);
    saveDecks();
    renderDecks();
    newDeckModal.classList.remove("active");
  });

  document
    .getElementById("openNewCardModalBtn")
    .addEventListener("click", () => {
      document.getElementById("newCardForm").reset();
      newCardModal.classList.add("active");
    });

  document.getElementById("closeCardModalBtn").addEventListener("click", () => {
    newCardModal.classList.remove("active");
  });

  document.getElementById("newCardForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const front = document.getElementById("cardFrontInput").value.trim();
    const back = document.getElementById("cardBackInput").value.trim();
    const phonetic = document.getElementById("cardPhoneticInput").value.trim();
    const example = document.getElementById("cardExampleInput").value.trim();

    const deckIndex = myDecks.findIndex((d) => d.id === activeDeckId);
    if (deckIndex !== -1) {
      myDecks[deckIndex].cards.push({ front, back, phonetic, example });
      saveDecks();
      renderCardList(myDecks[deckIndex]);
    }

    newCardModal.classList.remove("active");
  });

  renderDecks();
});
