import { login, register } from "./api.js";
import { showToast } from "./ui.js";

function checkTokenValidity(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem("token");
  return !!token && checkTokenValidity(token);
}

export function saveAuth(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user_info", JSON.stringify(data.user));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_info");
  document.dispatchEvent(new CustomEvent("auth:logout"));
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#logoutBtn")) {
    e.preventDefault();
    logout();
  }
});

export async function handleAuth(isLoginView, payload) {
  if (isLoginView) {
    return await login(payload.username, payload.password);
  } else {
    return await register(payload);
  }
}

let isLoginView = true;

export function initAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return; // Not on a page with modal

  const closeBtn = document.getElementById("closeModalBtn");
  const toggleLink = document.getElementById("toggleAuthLink");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const register_elements = document.querySelectorAll(".register-element");
  const submitBtn = document.getElementById("submitBtn");
  const togglePrompt = document.getElementById("togglePrompt");
  const authForm = document.getElementById("authForm");

  function openModal() {
    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
    authForm.reset();
  }

  function switchToLogin() {
    isLoginView = true;
    modalTitle.innerText = "Đăng nhập";
    modalDesc.innerText = "Chào mừng bạn trở lại vườn hoa! 🌻";
    register_elements.forEach((el) => {
      el.style.display = "none";
      const input = el.querySelector("input");
      if (input) input.removeAttribute("required");
    });
    submitBtn.innerText = "Đăng nhập";
    togglePrompt.innerText = "Bạn chưa có tài khoản?";
    toggleLink.innerText = "Đăng ký ngay 🌱";
  }

  function switchToRegister() {
    isLoginView = false;
    modalTitle.innerText = "Đăng ký";
    modalDesc.innerText = "Cùng gieo hạt giống tri thức mới nhé! 🌱";
    register_elements.forEach((el) => {
      el.style.display = "block";
      const input = el.querySelector("input");
      if (input) input.setAttribute("required", "true");
    });
    submitBtn.innerText = "Tạo tài khoản";
    togglePrompt.innerText = "Đã có tài khoản?";
    toggleLink.innerText = "Đăng nhập ngay 🌻";
  }

  // Global click event delegation for Auth modal triggers
  document.addEventListener("click", (e) => {
    // Handle Login triggers
    const targetText = e.target.getAttribute("data-target") || e.target.innerText;
    
    // Check if target requires login and user is NOT logged in
    const isProtectedAction = targetText === "Luyện TOEIC" || 
                              targetText === "Flashcard" || 
                              e.target.id === "navLoginBtn" || 
                              e.target.id === "heroCtaBtn";

    if (isProtectedAction && !isLoggedIn()) {
      e.preventDefault();
      switchToLogin();
      openModal();
    }
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

      const username = document.getElementById("Username")?.value.trim();
      const password = document.getElementById("Password")?.value;
      const fullname = document.getElementById("Fullname")?.value.trim();
      const email = document.getElementById("Email")?.value.trim();

      // Client-side Validation
      if (!isLoginView) {
        const confirmPassword = document.getElementById("ConfirmPassword")?.value;
        if (password.length < 6) {
          showToast("Mật khẩu phải dài ít nhất 6 ký tự!", "warning");
          return;
        }
        if (password !== confirmPassword) {
          showToast("Mật khẩu nhập lại không khớp!", "warning");
          return;
        }
        if (username.length < 3) {
          showToast("Tên tài khoản quá ngắn!", "warning");
          return;
        }
        if (username.includes(" ")) {
          showToast("Tên tài khoản không được chứa dấu cách!", "warning");
          return;
        }
      }

      const payload = { username, password, fullname, email };

      try {
        const result = await handleAuth(isLoginView, payload);

        if (isLoginView) {
          if (result.access_token) {
            saveAuth(result);
            showToast(result.message, "success");
            closeModal();
            document.dispatchEvent(new CustomEvent("auth:login"));
          } else {
            showToast(result.message || "Tài khoản hoặc mật khẩu không chính xác!", "error");
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

  // Auto logout check
  setInterval(() => {
    if (!isLoggedIn() && localStorage.getItem("token")) {
      logout();
    }
  }, 60 * 1000); // Check every minute instead of 12 hours
}
