import { initApp } from "./core.js";
import { isLoggedIn } from "./auth.js";

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
    tags: "Full Test • 200 câu",
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

let testTimerInterval;
let remainingSeconds = 7200;

function startTimer() {
  clearInterval(testTimerInterval);
  remainingSeconds = 7200;
  testTimerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(testTimerInterval);
      document.getElementById("resultModal").classList.add("active");
      return;
    }
    remainingSeconds--;
    let m = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    let s = (remainingSeconds % 60).toString().padStart(2, "0");
    document.getElementById("countdownTimer").innerText = `${m}:${s}`;
  }, 1000);
}

function renderLibrary(filterText) {
  const testGrid = document.getElementById("testGrid");
  if (!testGrid) return;
  testGrid.innerHTML = "";

  let filtered = mockTests;
  if (filterText === "Đề Full") {
    filtered = mockTests.filter((t) => t.tags.includes("Full"));
  } else if (filterText === "Chưa làm") {
    filtered = mockTests.filter((t) => t.status === "new");
  }

  filtered.forEach((test) => {
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
}

document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  document.addEventListener("auth:logout", () => {
    window.location.href = "index.html";
  });


  const tabs = document.querySelectorAll(".sidebar-menu li");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => {
        p.classList.remove("active");
        p.style.display = "none";
      });
      this.classList.add("active");
      const targetId = this.getAttribute("data-tab");
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add("active");
        targetPane.style.display = "block";
      }
      window.scrollTo(0, 0);
    });
  });

  const filterBtns = document.querySelectorAll(".filter-bar .filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      renderLibrary(e.target.innerText);
    });
  });
  renderLibrary("Tất cả");

  const historyList = document.getElementById("historyList");
  if (historyList) {
    mockHistory.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "history-item";
      row.innerHTML = `
        <div class="history-info">
          <h4>${item.name}</h4>
          <p>Ngày làm: ${item.date} • Thời gian: ${item.time}</p>
        </div>
        <div class="history-score">${item.score}</div>
        <button class="filter-btn history-detail-btn" data-index="${index}">Xem chi tiết</button>
      `;
      historyList.appendChild(row);
    });

    document.querySelectorAll(".history-detail-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const idx = this.getAttribute("data-index");
        const data = mockHistory[idx];
        const modal = document.getElementById("historyModal");
        const content = document.getElementById("historyDetailContent");
        content.innerHTML = `
          <p><strong>Bài thi:</strong> ${data.name}</p>
          <p><strong>Ngày hoàn thành:</strong> ${data.date}</p>
          <p><strong>Thời gian làm bài:</strong> ${data.time}</p>
          <p><strong>Điểm số:</strong> <span style="color:var(--accent-color); font-weight:bold">${data.score}</span></p>
          <p><strong>Listening:</strong> 410/495</p>
          <p><strong>Reading:</strong> 410/495</p>
        `;
        modal.classList.add("active");
      });
    });
  }

  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", () => {
      document.getElementById("historyModal").classList.remove("active");
    });
  }

  const backToLibraryBtn = document.getElementById("backToLibraryBtn");
  if (backToLibraryBtn) {
    backToLibraryBtn.addEventListener("click", () => {
      clearInterval(testTimerInterval);
      document.getElementById("mainSidebar").style.display = "block";
      const libTab = document.querySelector('[data-tab="library"]');
      if (libTab) libTab.click();
      window.scrollTo(0, 0);
    });
  }

  const partsConfig = [
    {
      name: "Part 1",
      start: 1,
      end: 6,
      hasImage: true,
      options: ["A", "B", "C", "D"],
      instruction: "Look at the picture and listen to the statements.",
    },
    {
      name: "Part 2",
      start: 7,
      end: 31,
      hasImage: false,
      options: ["A", "B", "C"],
      instruction: "Mark your answer on your answer sheet.",
    },
    {
      name: "Part 3",
      start: 32,
      end: 70,
      hasImage: false,
      options: ["A", "B", "C", "D"],
      instruction: "Listen to the conversation and answer.",
    },
    {
      name: "Part 4",
      start: 71,
      end: 100,
      hasImage: false,
      options: ["A", "B", "C", "D"],
      instruction: "Listen to the talk and answer.",
    },
    {
      name: "Part 5",
      start: 101,
      end: 130,
      hasImage: false,
      options: ["A", "B", "C", "D"],
      instruction: "Choose the correct answer.",
    },
    {
      name: "Part 6",
      start: 131,
      end: 146,
      hasImage: false,
      options: ["A", "B", "C", "D"],
      instruction: "Choose the correct text completion.",
    },
    {
      name: "Part 7",
      start: 147,
      end: 200,
      hasImage: false,
      options: ["A", "B", "C", "D"],
      instruction: "Read the passage and answer.",
    },
  ];

  const questionsContainer = document.getElementById("questionsContainer");
  const palette = document.getElementById("questionPalette");

  if (questionsContainer && palette) {
    partsConfig.forEach((pConfig) => {
      const pNum = pConfig.name.replace("Part ", "");

      const title = document.createElement("div");
      title.className = "palette-part-title";
      title.innerText = pConfig.name;
      palette.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "palette-grid";

      for (let i = pConfig.start; i <= pConfig.end; i++) {
        const qCard = document.createElement("div");
        qCard.className = "question-card";
        qCard.id = `q-${i}`;
        qCard.setAttribute("data-part", pNum);
        qCard.style.display = pNum === "1" ? "block" : "none";

        let htmlContent = "";
        if (pConfig.hasImage) {
          htmlContent += `<div class="img-placeholder">Ảnh Câu ${i}</div>`;
        }
        htmlContent += `<p class="q-text"><strong>${i}.</strong> ${pConfig.instruction}</p><div class="options">`;

        pConfig.options.forEach((opt) => {
          htmlContent += `<label class="option"><input type="radio" name="q${i}" value="${opt}" /><span>${opt}. Option ${opt}</span></label>`;
        });
        htmlContent += `</div>`;
        qCard.innerHTML = htmlContent;
        questionsContainer.appendChild(qCard);

        const btn = document.createElement("button");
        btn.className = "palette-btn";
        btn.id = `btn-q-${i}`;
        btn.innerText = i;

        btn.addEventListener("click", () => {
          const tabToClick = document.querySelector(
            `.part-tab[data-part="${pNum}"]`,
          );
          if (tabToClick && !tabToClick.classList.contains("active")) {
            tabToClick.click();
          }

          setTimeout(() => {
            const targetCard = document.getElementById(`q-${i}`);
            if (targetCard) {
              const y =
                targetCard.getBoundingClientRect().top + window.scrollY - 150;
              window.scrollTo({ top: y, behavior: "smooth" });
              targetCard.classList.add("highlight");
              setTimeout(() => {
                targetCard.classList.remove("highlight");
              }, 1500);
            }
          }, 100);
        });
        grid.appendChild(btn);
      }
      palette.appendChild(grid);
    });
  }

  const partTabs = document.querySelectorAll(".part-tab");
  const passageCol = document.getElementById("passageCol");
  const passageContent = document.getElementById("passageContent");

  partTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      partTabs.forEach((t) => t.classList.remove("active"));
      e.target.classList.add("active");

      const pNum = e.target.getAttribute("data-part");

      document.querySelectorAll(".question-card").forEach((card) => {
        if (card.getAttribute("data-part") === pNum) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });

      if (passageCol) {
        if (["1", "2", "3", "4", "5"].includes(pNum)) {
          passageCol.style.display = "none";
        } else {
          passageCol.style.display = "block";
          if (pNum === "6") {
            passageContent.innerHTML = `<h4>To: All Staff<br />From: Michael Davis<br />Subject: Network Upgrade</h4><p>We regret to inform the staff that as of next week, the employee key card system will not be active.</p>`;
          } else if (pNum === "7") {
            passageContent.innerHTML = `<h4>Dear Customer,</h4><p>Thank you for your recent purchase. Please find your invoice attached below.</p>`;
          }
        }
      }
      window.scrollTo(0, 0);
    });
  });

  if (questionsContainer) {
    questionsContainer.addEventListener("change", function (e) {
      if (e.target.type === "radio") {
        const qNum = e.target.name.replace("q", "");
        const palBtn = document.getElementById(`btn-q-${qNum}`);
        if (palBtn) {
          palBtn.classList.add("answered");
        }
      }
    });
  }

  const submitTestBtn = document.getElementById("submitTestBtn");
  const resultModal = document.getElementById("resultModal");
  const reviewBtn = document.getElementById("reviewBtn");

  if (submitTestBtn && resultModal) {
    submitTestBtn.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn nộp bài không?")) {
        clearInterval(testTimerInterval);
        resultModal.classList.add("active");
      }
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      resultModal.classList.remove("active");
      submitTestBtn.style.display = "none";
      document.getElementById("countdownTimer").innerText = "Chế độ xem lại";
      document.getElementById("countdownTimer").style.color = "#8D6E63";
      document
        .querySelectorAll('.options input[type="radio"]')
        .forEach((r) => (r.disabled = true));
    });
  }
});

window.openTestArea = function () {
  document.getElementById("mainSidebar").style.display = "none";
  document.querySelectorAll(".tab-pane").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.classList.add("active");
    testArea.style.display = "block";
  }

  const tabPart1 = document.querySelector('.part-tab[data-part="1"]');
  if (tabPart1) tabPart1.click();

  window.scrollTo(0, 0);
  startTimer();
};
