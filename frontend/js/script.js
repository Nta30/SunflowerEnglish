import { loadAllComponent } from "./component.js";
import { isLoggedIn, saveAuth, logout, handleAuth } from "./auth.js";
import { updateUIOnLogin, updateUIOnLogout, showToast, initNavbar } from "./ui.js";
document.addEventListener("DOMContentLoaded", async () => {
  await loadAllComponent();

  initNavbar();

  const flashcard = document.getElementById("demoCard");
  if (flashcard) {
    flashcard.addEventListener("click", () => {
      flashcard.classList.toggle("is-flipped");
    });
  }
  setInterval(() => {
      if (!isLoggedIn()) {
        initNavbar();
        logout();
        updateUIOnLogout(
          heroTitle,
          heroDesc,
          heroCtaBtn,
          practiceTestsSection,
        );
      }
  }, 12 * 60 * 60 * 1000);

  let isLoginView = true;

  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("closeModalBtn");
  const toggleLink = document.getElementById("toggleAuthLink");

  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const register_element = document.querySelectorAll(".register-element");
  const submitBtn = document.getElementById("submitBtn");
  const togglePrompt = document.getElementById("togglePrompt");

  const authForm = document.getElementById("authForm");

  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroCtaBtn = document.getElementById("heroCtaBtn");

  const practiceTestsSection = document.getElementById("practiceTestsSection");

  function openModal() {
    modal.classList.add("active");
  }
  function closeModal() {
    modal.classList.remove("active");
  }

  function switchToLogin() {
    isLoginView = true;
    modalTitle.innerText = "Đăng nhập";
    modalDesc.innerText = "Chào mừng bạn trở lại vườn hoa! 🌻";
    register_element.forEach((el) => {
      el.style.display = "none";
      const input = el.querySelector("input");
      if (input) {
        input.removeAttribute("required");
      }
    });
    submitBtn.innerText = "Đăng nhập";
    togglePrompt.innerText = "Bạn chưa có tài khoản?";
    toggleLink.innerText = "Đăng ký ngay 🌱";
  }

  function switchToRegister() {
    isLoginView = false;
    modalTitle.innerText = "Đăng ký";
    modalDesc.innerText = "Cùng gieo hạt giống tri thức mới nhé! 🌱";
    register_element.forEach((el) => {
      el.style.display = "block";
      const input = el.querySelector("input");
      if (input) input.setAttribute("required", "true");
    });
    submitBtn.innerText = "Tạo tài khoản";
    togglePrompt.innerText = "Đã có tài khoản?";
    toggleLink.innerText = "Đăng nhập ngay 🌻";
  }

  if (isLoggedIn()) {
    updateUIOnLogin(heroTitle, heroDesc, heroCtaBtn, practiceTestsSection);
  } else {
    updateUIOnLogout(heroTitle, heroDesc, heroCtaBtn, practiceTestsSection);
  }

  document
    .querySelectorAll(".nav-links a, #navLoginBtn, #heroCtaBtn")
    .forEach((element) => {
      element.addEventListener("click", function (e) {
        if (isLoggedIn()) return;

        const targetText = this.getAttribute("data-target") || this.innerText;
        if (
          targetText === "Luyện TOEIC" ||
          targetText === "Flashcard" ||
          this.id === "navLoginBtn" ||
          this.id === "heroCtaBtn"
        ) {
          e.preventDefault();

          if (this.id === "heroCtaBtn") {
            switchToRegister();
          } else {
            switchToLogin();
          }
          openModal();
        }
      });
    });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (toggleLink) {
    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      isLoginView ? switchToRegister() : switchToLogin();
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("Username").value;
      const password = document.getElementById("Password").value;
      const fullname = document.getElementById("Fullname").value;
      const email = document.getElementById("Email").value;

      const payload = { username, password, fullname, email };

      try {
        const result = await handleAuth(isLoginView, payload);

        if (isLoginView) {
          if (result.access_token) {
            saveAuth(result);
            initNavbar();
            updateUIOnLogin(
              heroTitle,
              heroDesc,
              heroCtaBtn,
              practiceTestsSection,
            );
            showToast(result.message, "success");
            closeModal();
          } else {
            showToast(result.message, "error");
          }
        } else {
          showToast(result.message, "success");
          switchToLogin();
        }
      } catch (error) {
        showToast("Không kết nối được với Server Backend!", "error");
      }
    });
  }
});
