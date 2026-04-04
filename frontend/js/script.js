import { initApp } from "./core.js";
import { isLoggedIn } from "./auth.js";
import { updateUIOnLogin, updateUIOnLogout, initNavbar } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initApp();

  const flashcard = document.getElementById("demoCard");
  if (flashcard) {
    flashcard.addEventListener("click", () => {
      flashcard.classList.toggle("is-flipped");
    });
  }

  // Initial UI State setup
  if (isLoggedIn()) {
    updateUIOnLogin();
  } else {
    updateUIOnLogout();
  }

  // --- Auth Events Handling ---
  // Decoupled completely from modal behavior and APIs.
  document.addEventListener("auth:login", () => {
    initNavbar();
    updateUIOnLogin();
  });

  document.addEventListener("auth:logout", () => {
    initNavbar();
    updateUIOnLogout();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

