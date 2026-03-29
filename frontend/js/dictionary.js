import { initApp } from "./core.js";
import { isLoggedIn } from "./auth.js";
import { showToast } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
  
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

  if (searchBtn) searchBtn.addEventListener("click", performSearch);

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(wordTitle.innerText);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    });
  }

  if (saveWordBtn) {
    saveWordBtn.addEventListener("click", () => {
      if (!isLoggedIn()) {
        showToast("Bạn cần đăng nhập để lưu từ vựng vào Flashcard nhé! 🌱", "warning");
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
  }
});
