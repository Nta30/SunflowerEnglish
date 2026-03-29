import { loadAllComponent } from "./component.js";
import { initAuthModal } from "./auth.js";
import { initNavbar } from "./ui.js";

export async function initApp() {
  await loadAllComponent();
  initNavbar();
  initAuthModal();
  
  // Auto-highlight active navigation link based on URL
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
      const linkTarget = a.getAttribute('href');
      // Special logic: toeic.html might be active even if we are in another toeic page
      if (linkTarget === path) {
         a.style.color = "var(--primary-hover)";
      } else {
         a.style.color = "";
      }
  });
}
