const mockTests = [
  {
    id: 1,
    name: "ETS 2024 - Test 1",
    tags: "Full Test • 200 câu",
    status: "new",
    statusText: "Chưa làm",
  },
  {
    id: 2,
    name: "Hacker TOEIC 3",
    tags: "Mini Test • 50 câu",
    status: "prog",
    statusText: "Đang làm 45%",
  },
  {
    id: 3,
    name: "ETS 2023 - Test 5",
    tags: "Full Test • 200 câu",
    status: "done",
    statusText: "Đã xong: 820",
  },
  {
    id: 4,
    name: "Economy Vol 5",
    tags: "Reading • 100 câu",
    status: "new",
    statusText: "Chưa làm",
  },
];

const mockHistory = [
  {
    date: "15/11/2025",
    name: "ETS 2023 - Test 5",
    score: "820",
    time: "115:30",
  },
  {
    date: "10/11/2025",
    name: "Mini Test LC Part 1,2",
    score: "85/100",
    time: "25:00",
  },
  {
    date: "02/11/2025",
    name: "ETS 2023 - Test 1",
    score: "710",
    time: "120:00",
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

  const tabs = document.querySelectorAll(".sidebar-menu li");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      window.scrollTo(0, 0);
    });
  });

  const testGrid = document.getElementById("testGrid");
  mockTests.forEach((test) => {
    const card = document.createElement("div");
    card.className = "lib-card";

    let btnClass = "btn-start";
    let btnText = test.status === "prog" ? "Tiếp tục làm" : "Làm bài ngay";
    if (test.status === "done") {
      btnClass = "btn-review";
      btnText = "Xem lại kết quả";
    }

    card.innerHTML = `
            <span class="lib-status status-${test.status}">${test.statusText}</span>
            <h3>${test.name}</h3>
            <p>${test.tags}</p>
            <button class="lib-action ${btnClass}" onclick="openTestArea()">${btnText}</button>
        `;
    testGrid.appendChild(card);
  });

  const historyList = document.getElementById("historyList");
  mockHistory.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
            <div class="history-info">
                <h4>${item.name}</h4>
                <p>Ngày làm: ${item.date} • Thời gian: ${item.time}</p>
            </div>
            <div class="history-score">${item.score}</div>
            <button class="filter-btn">Xem chi tiết</button>
        `;
    historyList.appendChild(row);
  });

  const backToLibraryBtn = document.getElementById("backToLibraryBtn");
  backToLibraryBtn.addEventListener("click", () => {
    document.querySelector('[data-tab="library"]').click();
  });

  const submitTestBtn = document.getElementById("submitTestBtn");
  const resultModal = document.getElementById("resultModal");
  const reviewBtn = document.getElementById("reviewBtn");

  submitTestBtn.addEventListener("click", () => {
    resultModal.classList.add("active");
  });

  reviewBtn.addEventListener("click", () => {
    resultModal.classList.remove("active");
    submitTestBtn.style.display = "none";
    document.getElementById("countdownTimer").innerText = "Chế độ xem lại";
  });
});

window.openTestArea = function () {
  document
    .querySelectorAll(".sidebar-menu li")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-pane")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("testArea").classList.add("active");
  window.scrollTo(0, 0);
};
