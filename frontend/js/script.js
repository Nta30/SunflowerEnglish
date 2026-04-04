import { loadAllComponent } from "./component.js";
import { isLoggedIn, saveAuth, logout, handleAuth } from "./auth.js";
import {
  updateUIOnLogin,
  updateUIOnLogout,
  showToast,
  initNavbar,
} from "./ui.js";
document.addEventListener("DOMContentLoaded", async () => {
  await loadAllComponent();

  initNavbar();

  const flashcard = document.getElementById("demoCard");
  if (flashcard) {
    flashcard.addEventListener("click", () => {
      flashcard.classList.toggle("is-flipped");
    });
  }
  setInterval(
    () => {
      if (!isLoggedIn()) {
        initNavbar();
        logout();
        updateUIOnLogout(heroTitle, heroDesc, heroCtaBtn, practiceTestsSection);
      }
    },
    12 * 60 * 60 * 1000,
  );

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

      const payload = {
        username: username,
        password: password,
      };

      try {
        // GỌI XUỐNG BACKEND ĐỂ XÁC THỰC
        const result = await handleAuth(isLoginView, payload);

        // In log ra để bạn kiểm tra xem Backend trả về chính xác data gì
        console.log("Kết quả từ Backend:", result);

        // Nếu Backend trả về token thành công
        if (result.access_token) {
          saveAuth(result);

          // Lấy username người dùng vừa nhập và chuyển thành chữ thường cho chắc chắn
          const currentUsername = username.toLowerCase();

          // Chỉ cần gõ đúng tên admin là cho vào thẳng, không cần check object user từ Backend nữa
          if (
            currentUsername === "admin" ||
            currentUsername === "admin@gmail.com"
          ) {
            localStorage.setItem("isAdmin", "true");
            alert("🌻 Chào Quản trị viên! Đang vào trang quản lý...");

            // Xóa đi các lỗi có thể cản trở việc chuyển trang
            closeModal();
            window.location.href = "./admin.html";
          } else {
            localStorage.setItem("isAdmin", "false");
            initNavbar();
            updateUIOnLogin(
              heroTitle,
              heroDesc,
              heroCtaBtn,
              practiceTestsSection,
            );
            closeModal();
          }
          showToast(result.message, "success");
        } else {
          // Backend trả về lỗi (Ví dụ: Sai mật khẩu, tài khoản không tồn tại)
          showToast(result.message || "Đăng nhập thất bại!", "error");
        }
      } catch (error) {
        // Lỗi này nhảy ra khi Backend KHÔNG PHẢN HỒI (Sập server, sai cổng, lỗi CORS)
        console.error("Auth Error:", error);
        showToast(
          "Không kết nối được với Server Backend! Hãy chắc chắn Server đang chạy.",
          "error",
        );
      }
    });
  }
});
