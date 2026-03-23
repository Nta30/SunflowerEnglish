document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const navLoginBtn = document.getElementById("navLoginBtn");
  const userMenu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isLoggedIn) {
    if (navLoginBtn) navLoginBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "block";
  } else {
    if (navLoginBtn) navLoginBtn.style.display = "inline-block";
    if (userMenu) userMenu.style.display = "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const welcomeState = document.getElementById("welcomeState");
  const resultState = document.getElementById("resultState");
  const audioBtn = document.getElementById("audioBtn");
  const saveWordBtn = document.getElementById("saveWordBtn");
  const wordTitle = document.getElementById("wordTitle");

  function performSearch() {
    const query = searchInput.value.trim();
    if (query === "") return;

    wordTitle.innerText = query.toLowerCase();

    welcomeState.style.display = "none";
    resultState.style.display = "block";
  }

  searchBtn.addEventListener("click", performSearch);

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  audioBtn.addEventListener("click", () => {
    const utterance = new SpeechSynthesisUtterance(wordTitle.innerText);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  });

  saveWordBtn.addEventListener("click", () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để lưu từ vựng vào Flashcard nhé! 🌱");
      return;
    }

    if (saveWordBtn.innerText === "❤️") {
      saveWordBtn.innerText = "💔";
      saveWordBtn.style.backgroundColor = "#F5F5F5";
      saveWordBtn.style.color = "#9E9E9E";
    } else {
      saveWordBtn.innerText = "❤️";
      saveWordBtn.style.backgroundColor = "#FFEBEE";
      saveWordBtn.style.color = "#D32F2F";
    }
  });
});
