document.addEventListener("DOMContentLoaded", () => {
  const flashcard = document.getElementById("demoCard");
  if (flashcard) {
    flashcard.addEventListener("click", () => {
      flashcard.classList.toggle("is-flipped");
    });
  }

  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
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
  const navLoginBtn = document.getElementById("navLoginBtn");

  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroCtaBtn = document.getElementById("heroCtaBtn");

  const userMenu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");
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

  function updateUIOnLogin() {
    navLoginBtn.style.display = "none";
    userMenu.style.display = "block";

    if (heroTitle && heroDesc && heroCtaBtn) {
      heroTitle.innerHTML =
        'Chào mừng bạn quay lại, <br> <span class="highlight">Học viên Hướng Dương!</span>';
      heroDesc.innerText =
        'Hôm nay bạn muốn tưới thêm kiến thức cho "vườn TOEIC" của mình hay ôn tập Flashcard nào?';
      heroCtaBtn.innerText = "Vào học ngay thôi 🚀";

      if (practiceTestsSection) {
        practiceTestsSection.style.display = "block";
        practiceTestsSection.style.animation = "fadeIn 0.8s ease-out";
      }
    }
  }

  function updateUIOnLogout() {
    navLoginBtn.style.display = "inline-block";
    userMenu.style.display = "none";

    if (heroTitle && heroDesc && heroCtaBtn) {
      heroTitle.innerHTML =
        'Cùng vươn lên đón nắng với <br> <span class="highlight">Sunflower English</span>';
      heroDesc.innerText =
        'Nền tảng học tiếng Anh cực "chill", giúp bạn ghi nhớ từ vựng và chinh phục TOEIC mỗi ngày như một thói quen vui vẻ!';
      heroCtaBtn.innerText = "Bắt đầu trồng hoa ngay 🌱";

      if (practiceTestsSection) {
        practiceTestsSection.style.display = "none";
      }
    }
  }

  if (isLoggedIn) {
    updateUIOnLogin();
  } else {
    updateUIOnLogout();
  }

  document
    .querySelectorAll(".nav-links a, #navLoginBtn, #heroCtaBtn")
    .forEach((element) => {
      element.addEventListener("click", function (e) {
        if (isLoggedIn) return;

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

      // Đăng ký
      const url = isLoginView ? "/api/auth/login" : "/api/auth/register";
      const payload = isLoginView
        ? { username, password }
        : { username, password, fullname, email };

      try {
        const response = await fetch(`http://127.0.0.1:5000${url}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          if (isLoginView) {
            // Lưu Token vào LocalStorage
            localStorage.setItem("token", result.access_token);
            localStorage.setItem("user_info", JSON.stringify(result.user));
            localStorage.setItem("isLoggedIn", "true");

            alert("🌻 Đăng nhập thành công!");
            isLoggedIn = true;
            updateUIOnLogin();
            closeModal();
          } else {
            alert("🌱 Đăng ký thành công! Hãy đăng nhập nhé.");
            switchToLogin();
          }
        } else {
          alert(result.message); 
        }
      } catch (error) {
        alert("❌ Không kết nối được với Server Backend!");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      isLoggedIn = false;
      localStorage.removeItem("isLoggedIn");
      updateUIOnLogout();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
