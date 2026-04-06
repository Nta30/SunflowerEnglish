import { isLoggedIn } from "./auth.js";

export function initNavbar(){
  const navLoginBtn = document.getElementById("navLoginBtn");
  const userMenu = document.getElementById("userMenu");
  const usernameDisplay = document.querySelector(".user-name");

  if (!navLoginBtn || !userMenu || !usernameDisplay) return;

  let userInfo = localStorage.getItem("user_info");
  let username = "";
  try {
    username = userInfo ? JSON.parse(userInfo).username : "Học viên Hướng Dương";
  } catch (e) {
    username = "Học viên Hướng Dương";
  }

  if (isLoggedIn()) {
    navLoginBtn.style.display = "none";
    userMenu.style.display = "block";
    usernameDisplay.innerText = username;
  } else {
    navLoginBtn.style.display = "inline-block";
    userMenu.style.display = "none";
  }
}

function resetAuthState() {
  const usernameInput = document.getElementById("Username");
  const passwordInput = document.getElementById("Password");
  const fullnameInput = document.getElementById("Fullname");
  const emailInput = document.getElementById("Email");
  if (usernameInput) usernameInput.value = "";
  if (passwordInput) passwordInput.value = "";
  if (fullnameInput) fullnameInput.value = "";
  if (emailInput) emailInput.value = "";
}

export function updateUIOnLogin(){
    resetAuthState();
    const heroTitle = document.getElementById("heroTitle");
    const heroDesc = document.getElementById("heroDesc");
    const heroCtaBtn = document.getElementById("heroCtaBtn");

    if (heroTitle && heroDesc && heroCtaBtn) {
      heroTitle.innerHTML =
        'Chào mừng bạn quay lại, <br> <span class="highlight">Học viên Hướng Dương!</span>';
      heroDesc.innerText =
        'Hôm nay bạn muốn tưới thêm kiến thức cho "vườn TOEIC" của mình hay ôn tập Flashcard nào?';
      heroCtaBtn.innerText = "Vào học ngay thôi 🚀";
    }
}

export function updateUIOnLogout() {
    resetAuthState();
    const heroTitle = document.getElementById("heroTitle");
    const heroDesc = document.getElementById("heroDesc");
    const heroCtaBtn = document.getElementById("heroCtaBtn");

    if (heroTitle && heroDesc && heroCtaBtn) {
      heroTitle.innerHTML =
        'Cùng vươn lên đón nắng với <br> <span class="highlight">Sunflower English</span>';
      heroDesc.innerText =
        'Nền tảng học tiếng Anh cực "chill", giúp bạn ghi nhớ từ vựng và chinh phục TOEIC mỗi ngày như một thói quen vui vẻ!';
      heroCtaBtn.innerText = "Bắt đầu trồng hoa ngay 🌱";
    }
}

export function showToast(message, type) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}
