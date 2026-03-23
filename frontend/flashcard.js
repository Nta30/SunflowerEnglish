const mockDecks = [
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

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    window.location.href = "index.html";
    return;
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
  const studyView = document.getElementById("studyView");
  const deckGrid = document.getElementById("deckGrid");
  const backToDecksBtn = document.getElementById("backToDecksBtn");
  const currentDeckTitle = document.getElementById("currentDeckTitle");
  const studyProgress = document.getElementById("studyProgress");

  const studyCard = document.getElementById("studyCard");
  const frontWord = document.getElementById("frontWord");
  const backWord = document.getElementById("backWord");
  const backPhonetic = document.getElementById("backPhonetic");
  const backExample = document.getElementById("backExample");

  const btnForget = document.getElementById("btnForget");
  const btnHard = document.getElementById("btnHard");
  const btnEasy = document.getElementById("btnEasy");

  let currentDeck = null;
  let currentCardIndex = 0;

  function renderDecks() {
    deckGrid.innerHTML = "";
    mockDecks.forEach((deck) => {
      const deckCard = document.createElement("div");
      deckCard.className = "deck-card";
      deckCard.innerHTML = `
                <div class="deck-icon">${deck.icon}</div>
                <h3 class="deck-title">${deck.title}</h3>
                <span class="deck-stats">${deck.cards.length} thẻ</span>
            `;
      deckCard.addEventListener("click", () => startStudy(deck));
      deckGrid.appendChild(deckCard);
    });
  }

  function startStudy(deck) {
    currentDeck = deck;
    currentCardIndex = 0;

    deckListView.style.display = "none";
    studyView.style.display = "block";

    currentDeckTitle.innerText = `Đang học: ${deck.title}`;
    loadCard();
  }

  function loadCard() {
    if (currentCardIndex >= currentDeck.cards.length) {
      alert(
        "Tuyệt vời! Bạn đã hoàn thành việc tưới nước cho vườn từ vựng này. 🌱",
      );
      deckListView.style.display = "block";
      studyView.style.display = "none";
      return;
    }

    const card = currentDeck.cards[currentCardIndex];
    studyCard.classList.remove("is-flipped");

    setTimeout(() => {
      frontWord.innerText = card.front;
      backWord.innerText = card.back;
      backPhonetic.innerText = card.phonetic;
      backExample.innerText = card.example;
      studyProgress.innerText = `${currentCardIndex + 1}/${currentDeck.cards.length}`;
    }, 150);
  }

  function nextCard() {
    currentCardIndex++;
    loadCard();
  }

  studyCard.addEventListener("click", () => {
    studyCard.classList.toggle("is-flipped");
  });

  backToDecksBtn.addEventListener("click", () => {
    deckListView.style.display = "block";
    studyView.style.display = "none";
  });

  btnForget.addEventListener("click", nextCard);
  btnHard.addEventListener("click", nextCard);
  btnEasy.addEventListener("click", nextCard);

  renderDecks();
});
