import { initApp } from "./core.js";
import { isLoggedIn } from "./auth.js";
import { getExams, getExamDetail, submitExam, getExamHistory, getSessionDetail } from "./api.js";

// ============================================================
// APP STATE
// ============================================================
let engine = null;
let currentExamId = null;
let allExams = [];
let examHistory = [];
let pendingExamId = null;
let lastResultSessionId = null;
let countdownInterval = null;
let isReviewMode = false; // Cờ theo dõi chế độ xem lại lịch sử

// ============================================================
// EXAM ENGINE
// ============================================================
class ExamEngine {
  constructor(examData, selectedParts, isFullTest, customMinutes, isReviewMode = false) {
    this.examData = examData;
    this.isFullTest = isFullTest;
    this.isReviewMode = isReviewMode;

    // Lọc câu hỏi theo part đã chọn
    this.questions = (isFullTest || !selectedParts.length)
      ? [...examData.questions]
      : examData.questions.filter(q => selectedParts.includes(q.TenPart));

    this.answers = {};           // { MaCauHoi: MaDapAn }
    this.items = this._buildItems();
    this.currentItemIndex = 0;
    this.timeSeconds = isFullTest
      ? (examData.ThoiGianLam || 120) * 60
      : (customMinutes || 30) * 60;

    this._timerInterval = null;
    this.onTimerTick = null;
    this.onTimeUp = null;
    this.onItemChange = null;
  }

  _buildItems() {
    const items = [];
    const seenGroups = new Set();
    for (const q of this.questions) {
      if (q.MaNhom) {
        if (!seenGroups.has(q.MaNhom)) {
          seenGroups.add(q.MaNhom);
          const groupQs = this.questions.filter(x => x.MaNhom === q.MaNhom);
          items.push({ type: "group", nhom: q.nhom, questions: groupQs });
        }
      } else {
        items.push({ type: "single", questions: [q] });
      }
    }
    return items;
  }

  get currentItem() { return this.items[this.currentItemIndex]; }
  get totalItems()  { return this.items.length; }
  get totalQs()     { return this.questions.length; }
  get answeredQs()  { return Object.keys(this.answers).length; }

  isListening(item) {
    return (item ?? this.currentItem)?.questions[0]?.TenPart <= 4;
  }

  canGoNext() { return this.currentItemIndex < this.items.length - 1; }
  // Cho phép quay về cả Listening khi trong chế độ xem lại lịch sử
  canGoPrev() { return (this.isReviewMode || !this.isListening()) && this.currentItemIndex > 0; }

  goNext() {
    if (!this.canGoNext()) return false;
    this.currentItemIndex++;
    this.onItemChange?.();
    return true;
  }
  goPrev() {
    if (!this.canGoPrev()) return;
    this.currentItemIndex--;
    this.onItemChange?.();
  }

  goToSTT(stt) {
    const idx = this.items.findIndex(item => item.questions.some(q => q.STT === stt));
    // Ở chế độ thi, chặn nhảy câu phần Listening. Ở chế độ Review thì cho phép tự do.
    if (idx === -1 || (!this.isReviewMode && this.isListening(this.items[idx]))) return false;
    this.currentItemIndex = idx;
    this.onItemChange?.();
    return true;
  }

  recordAnswer(questionId, answerId) {
    this.answers[String(questionId)] = answerId;
  }
  getAnswer(questionId) { return this.answers[String(questionId)]; }

  startTimer() {
    this._timerInterval = setInterval(() => {
      this.timeSeconds--;
      this.onTimerTick?.(this.timeSeconds);
      if (this.timeSeconds <= 0) { this.stopTimer(); this.onTimeUp?.(); }
    }, 1000);
  }
  stopTimer() { clearInterval(this._timerInterval); }

  formatTime(s) {
    s = Math.max(0, s);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  buildSubmitPayload() {
    const parts = this.isFullTest ? [] : [...new Set(this.questions.map(q => q.TenPart))];
    return { answers: this.answers, selectedParts: parts };
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
  if (!isLoggedIn()) { window.location.href = "index.html"; return; }
  document.addEventListener("auth:logout", () => { window.location.href = "index.html"; });

  initTabs();
  initFilterBtns();
  initModeModal();
  initExamControls();
  initResultModal();

  await Promise.all([loadLibrary(), loadHistory()]);
  updateDashboard();
});

// ============================================================
// TABS
// ============================================================
function initTabs() {
  document.querySelectorAll(".sidebar-menu li").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".sidebar-menu li").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => { p.classList.remove("active"); p.style.display = "none"; });
      this.classList.add("active");
      const pane = document.getElementById(this.dataset.tab);
      if (pane) { pane.classList.add("active"); pane.style.display = "block"; }
      window.scrollTo(0, 0);
    });
  });
}

// ============================================================
// LIBRARY & HISTORY
// ============================================================
async function loadLibrary() {
  try {
    const data = await getExams();
    allExams = Array.isArray(data) ? data : [];
  } catch { allExams = []; }
  renderLibrary("all");
}

function renderLibrary(filter) {
  const grid = document.getElementById("testGrid");
  if (!grid) return;
  let list = allExams;
  if (filter === "full") list = allExams.filter(e => (e.SoCau || 0) >= 100);
  else if (filter === "new") list = allExams.filter(e => e.TrangThai === "new");

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">🌱 Chưa có đề thi nào.</div>`; return;
  }
  
  grid.innerHTML = list.map(exam => {
    const sc = `status-${exam.TrangThai || "new"}`;
    return `
      <div class="lib-card">
        <span class="lib-status ${sc}">${exam.TrangThaiText || "Chưa làm"}</span>
        <h3>${exam.TenDeThi}</h3>
        <p class="lib-tags">${exam.MoTa ? exam.MoTa : ""}</p>
        <button class="lib-action" onclick="openModeModal(${exam.MaDeThi})">
          ${exam.TrangThai === "done" ? "Làm lại" : exam.TrangThai === "prog" ? "Tiếp tục" : "Làm bài ngay"}
        </button>
      </div>`;
  }).join("");
}

function initFilterBtns() {
  document.querySelectorAll(".filter-btn[data-filter]").forEach(btn => {
    btn.addEventListener("click", e => {
      document.querySelectorAll(".filter-btn[data-filter]").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      renderLibrary(e.currentTarget.dataset.filter);
    });
  });
}

async function loadHistory() {
  try {
    const data = await getExamHistory();
    examHistory = Array.isArray(data) ? data : [];
  } catch { examHistory = []; }
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  if (!examHistory.length) {
    list.innerHTML = `<div class="empty-state">🌱 Chưa có lịch sử nào. Hãy làm bài đầu tiên!</div>`; return;
  }
  list.innerHTML = examHistory.map(item => {
    const date = item.ThoiGianKetThuc ? new Date(item.ThoiGianKetThuc).toLocaleDateString("vi-VN") : "--";
    const dur = calcDuration(item.ThoiGianBatDau, item.ThoiGianKetThuc);
    return `
      <div class="history-item">
        <div class="history-info">
          <h4>${item.TenDeThi}</h4>
          <p>Ngày: ${date} • Thời gian làm: ${dur}</p>
          <div class="history-stats">
            <span class="correct-badge">✓ ${item.SoCauDung || 0} đúng</span>
            <span class="wrong-badge">✗ ${item.SoCauSai || 0} sai</span>
          </div>
        </div>
        <div class="history-right">
          <div class="history-score">${item.DiemSo || 0}</div>
          <button class="btn-history-detail" onclick="openHistoryDetail(${item.MaPhien})">Xem chi tiết</button>
        </div>
      </div>`;
  }).join("");
}

function calcDuration(start, end) {
  if (!start || !end) return "--";
  const ms = new Date(end) - new Date(start);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}p${s.toString().padStart(2, "0")}s`;
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboard() {
  renderHistory();
  
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  
  // Nếu chưa có lịch sử làm bài
  if (!examHistory || !examHistory.length) { 
    ["statBest", "statAvg", "statLowest", "statCount"].forEach(id => set(id, "--")); 
    set("lcScoreLabel", "-- / 495");
    set("rcScoreLabel", "-- / 495");
    document.getElementById("lcBar").style.width = "0%";
    document.getElementById("rcBar").style.width = "0%";
    return; 
  }

  // Lọc ra các bài đã nộp (có tổng điểm)
  const scores = examHistory.map(h => h.DiemSo || 0);
  const lcScores = examHistory.map(h => h.DiemLC || 0);
  const rcScores = examHistory.map(h => h.DiemRC || 0);

  // 1. Cập nhật 4 thẻ Stats tổng quan
  set("statBest", Math.max(...scores));
  set("statLowest", Math.min(...scores));
  set("statAvg", Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
  set("statCount", examHistory.length);

  // 2. Tính điểm trung bình kỹ năng LC & RC
  const avgLC = Math.round(lcScores.reduce((a, b) => a + b, 0) / lcScores.length);
  const avgRC = Math.round(rcScores.reduce((a, b) => a + b, 0) / rcScores.length);

  set("lcScoreLabel", `${avgLC} / 495`);
  set("rcScoreLabel", `${avgRC} / 495`);

  // 3. Chạy animation thanh tiến trình
  // Dùng setTimeout để đảm bảo CSS Transition hoạt động mượt mà
  setTimeout(() => {
    const lcBar = document.getElementById("lcBar");
    const rcBar = document.getElementById("rcBar");
    // Chiếm % so với điểm tối đa là 495
    if (lcBar) lcBar.style.width = `${(avgLC / 495) * 100}%`;
    if (rcBar) rcBar.style.width = `${(avgRC / 495) * 100}%`;
  }, 100);
}

// ============================================================
// START EXAM MODAL
// ============================================================
window.openModeModal = function (examId) {
  pendingExamId = examId;
  const exam = allExams.find(e => e.MaDeThi === examId);
  if (!exam) return;
  const el = id => document.getElementById(id);
  el("modeModalExamName").textContent = exam.TenDeThi;
  el("fullTimeLabel").textContent = `${exam.ThoiGianLam || 120} phút`;
  el("partCheckboxes").innerHTML = [1,2,3,4,5,6,7].map(p =>
    `<label class="part-check-label"><input type="checkbox" value="${p}" class="part-checkbox" checked />Part ${p}</label>`
  ).join("");
  document.querySelector('input[name="examMode"][value="full"]').checked = true;
  el("partSelectorArea").style.display = "none";
  el("modeModal").classList.add("active");
};

function initModeModal() {
  document.querySelectorAll('input[name="examMode"]').forEach(r => {
    r.addEventListener("change", () => {
      const isPart = document.querySelector('input[name="examMode"]:checked')?.value === "part";
      document.getElementById("partSelectorArea").style.display = isPart ? "block" : "none";
    });
  });
  document.getElementById("cancelModeBtn")?.addEventListener("click", () =>
    document.getElementById("modeModal").classList.remove("active")
  );
  document.getElementById("startExamBtn")?.addEventListener("click", startExam);
}

async function startExam() {
  const mode = document.querySelector('input[name="examMode"]:checked')?.value;
  const isFullTest = mode === "full";
  let selectedParts = [], customMinutes = 30;

  if (!isFullTest) {
    selectedParts = [...document.querySelectorAll(".part-checkbox:checked")].map(cb => parseInt(cb.value));
    if (!selectedParts.length) { alert("Vui lòng chọn ít nhất 1 Part!"); return; }
    customMinutes = parseInt(document.getElementById("customTimeInput").value) || 30;
  }

  document.getElementById("modeModal").classList.remove("active");
  isReviewMode = false;
  
  // UI setups for Testing
  document.getElementById("submitExamBtn").style.display = "block";
  document.getElementById("timerWidgetWrap").style.display = "block";
  document.getElementById("examNavActions").style.display = "none";

  showExamArea();
  document.getElementById("questionDisplay").innerHTML =
    `<div class="loading-state"><div class="loading-spinner"></div><p>Đang tải đề thi...</p></div>`;

  try {
    const examData = await getExamDetail(pendingExamId);
    if (!examData?.questions) throw new Error("No data");

    currentExamId = pendingExamId;
    engine = new ExamEngine(examData, selectedParts, isFullTest, customMinutes, false);
    document.getElementById("examNameDisplay").textContent = examData.TenDeThi;
    document.getElementById("examModeBadge").textContent = isFullTest
      ? "Full Test" : `Part ${selectedParts.join(", ")}`;

    engine.onItemChange = renderCurrentItem;
    engine.onTimerTick = updateTimer;
    engine.onTimeUp = () => autoSubmit();

    buildPalette();
    renderCurrentItem();
    engine.startTimer();
    updateTimer(engine.timeSeconds);
  } catch (e) {
    console.error(e);
    document.getElementById("questionDisplay").innerHTML =
      `<div class="empty-state">❌ Không thể tải đề thi. Vui lòng thử lại.</div>`;
  }
}

// ============================================================
// EXAM AREA SHOW/HIDE
// ============================================================
function showExamArea() {
  document.getElementById("toeicLayout").style.display = "none";
  document.getElementById("examArea").style.display = "flex";
  window.scrollTo(0, 0);
}

function hideExamArea() {
  document.getElementById("examArea").style.display = "none";
  document.getElementById("toeicLayout").style.display = "flex";
}

// ============================================================
// RENDER QUESTION / GROUP
// ============================================================
function renderCurrentItem() {
  if (!engine) return;
  const item = engine.currentItem;
  if (!item) return;

  const isLC = engine.isListening();
  const ws = document.getElementById("examWorkspace");
  const zone1 = document.getElementById("examZone1");
  const zone3 = document.getElementById("examZone3");

  // Workspace layout class
  // Khi Xem lại lịch sử, ép dùng chung layout của reading để luôn có cột Palette (Zone 3) bên phải
  ws.className = "exam-workspace " + ((isLC && !engine.isReviewMode) ? "mode-listening" : "mode-reading");

  // Zone 1: Images
  const images = getItemImages(item);
  if (images.length) {
    document.getElementById("zone1Inner").innerHTML = images
      .map(url => `<img src="${url}" alt="Hình câu hỏi" loading="lazy" />`)
      .join("");
    zone1.style.display = "flex";
    ws.classList.add("has-image");
  } else {
    zone1.style.display = "none";
    ws.classList.remove("has-image");
  }

  // Zone 3 & Audio
  if (engine.isReviewMode) {
    // Review mode: Hiện Palette cho mọi kĩ năng, ẩn thanh đếm Listening HUD
    zone3.style.display = "flex";
    hideListeningHUD();
    stopAudio(); // Chặn audio ẩn tự động
    
    // Nút Prev / Next
    const prevBtn = document.getElementById("prevItemBtn");
    const nextBtn = document.getElementById("nextItemBtn");
    if(prevBtn) prevBtn.disabled = !engine.canGoPrev();
    if(nextBtn) nextBtn.disabled = !engine.canGoNext();
  } else {
    // Test mode
    if (isLC) {
      zone3.style.display = "none";
      showListeningHUD(item);
      const audioUrl = item.nhom?.AudioURL || item.questions[0].AudioURL;
      playAudio(audioUrl);
    } else {
      zone3.style.display = "flex";
      hideListeningHUD();
      stopAudio();
    }
  }

  updatePaletteCurrent();
  renderQuestionDisplay(item, engine.isReviewMode);
}

function getItemImages(item) {
  if (item.nhom?.images?.length) return item.nhom.images.map(i => i.ImgURL).filter(Boolean);
  if (item.questions[0].ImgURL) return [item.questions[0].ImgURL];
  return [];
}

function renderQuestionDisplay(item, isReview) {
  const container = document.getElementById("questionDisplay");
  let html = "";

  // Nếu trong chế độ Review của Listening, bơm Audio native ra để người dùng tự do nghe
  if (isReview && engine.isListening(item)) {
    const audioUrl = item.nhom?.AudioURL || item.questions[0].AudioURL;
    if (audioUrl) {
      html += `<audio controls src="${audioUrl}" class="review-audio-player" style="margin-bottom: 24px; width: 100%; outline: none; border-radius: 8px;"></audio>`;
    }
  }

  // Từng câu hỏi
  item.questions.forEach(q => {
    // Nếu reviewMode, truyền DapAnChonId thay cho engine.answers
    const answered = isReview ? q.DapAnChonId : engine.getAnswer(q.MaCauHoi);
    html += buildQuestionHTML(q, answered, isReview);
  });

  container.innerHTML = html;

  // Gắn sự kiện chọn đáp án (chỉ Test mode)
  if (!isReview) {
    container.querySelectorAll(".option-label").forEach(label => {
      label.addEventListener("click", () => {
        const qId = label.dataset.qid;
        const aId = parseInt(label.dataset.aid);
        engine.recordAnswer(qId, aId);
        container.querySelectorAll(`.option-label[data-qid="${qId}"]`).forEach(l => l.classList.remove("selected"));
        label.classList.add("selected");
        updatePaletteAnswered(qId);
      });
    });
  }
}

function buildQuestionHTML(q, selectedAnswerId, isReview) {
  const partLabel = `Part ${q.TenPart}`;
  let html = `
    <div class="question-card" id="qcard-${q.MaCauHoi}">
      <div class="question-num">Câu ${q.STT} <span class="question-part-badge">${partLabel}</span></div>
      <div class="question-text">${q.NoiDung || ""}</div>
      <div class="options">`;

  (q.dap_an || []).forEach(ans => {
    let cls = "option-label";
    const isSelected = String(selectedAnswerId) === String(ans.MaDapAn);
    
    if (isReview) {
      if (ans.IsCorrect) cls += " correct-ans";
      else if (isSelected && !ans.IsCorrect) cls += " wrong-ans";
    } else {
      if (isSelected) cls += " selected";
    }
    
    html += `
      <label class="${cls}" data-qid="${q.MaCauHoi}" data-aid="${ans.MaDapAn}">
        <span class="option-key">${ans.KyHieu}</span>
        <span>${ans.NoiDung || ""}${isReview && isSelected ? " <strong style='font-size:12px;margin-left:4px;'>(Bạn chọn)</strong>" : ""}</span>
      </label>`;
  });

  html += `</div>`;

  if (isReview && q.GiaiThich) {
    html += `<div class="question-explain"><strong>Giải thích:</strong> ${q.GiaiThich}</div>`;
  }

  html += `</div>`;
  return html;
}

// ============================================================
// AUDIO (Chỉ dùng khi làm bài thật)
// ============================================================
function playAudio(url) {
  const audio = document.getElementById("examAudio");
  if (!url || !audio) return;
  audio.src = url;
  audio.currentTime = 0;
  audio.play().catch(() => {});
  audio.onended = () => handleAudioEnded();
}

function stopAudio() {
  const audio = document.getElementById("examAudio");
  if (!audio) return;
  audio.pause();
  audio.src = "";
  audio.onended = null;
}

function handleAudioEnded() {
  let secs = 3;
  const cd = document.getElementById("lhudCountdown");
  const num = document.getElementById("countdownNum");
  if (cd && num) { cd.style.display = "block"; num.textContent = secs; }
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    secs--;
    if (num) num.textContent = secs;
    if (secs <= 0) {
      clearInterval(countdownInterval);
      if (cd) cd.style.display = "none";
      const moved = engine?.goNext();
      if (!moved) checkListeningDone();
    }
  }, 1000);
}

function checkListeningDone() {
  if (!engine) return;
  const hasReading = engine.items.some(item => !engine.isListening(item));
  if (hasReading) {
    const readingIdx = engine.items.findIndex(item => !engine.isListening(item));
    if (readingIdx !== -1) {
      engine.currentItemIndex = readingIdx;
      engine.onItemChange?.();
    }
  } else {
    autoSubmit();
  }
}

// ============================================================
// LISTENING HUD (Chỉ Test Mode)
// ============================================================
function showListeningHUD(item) {
  const hud = document.getElementById("listeningHud");
  if (!hud || !engine) return;
  hud.style.display = "flex";

  const part = item.questions[0].TenPart;
  document.getElementById("lhudPartLabel").textContent = `Part ${part}`;

  const lcItems = engine.items.filter(it => engine.isListening(it));
  const lcIdx = lcItems.indexOf(item);
  const total = lcItems.length;
  const current = lcIdx + 1;

  document.getElementById("lhudCurrent").textContent = current;
  document.getElementById("lhudTotal").textContent = total;
  document.getElementById("lhudBarFill").style.width = `${(current / total) * 100}%`;
}

function hideListeningHUD() {
  const hud = document.getElementById("listeningHud");
  if (hud) hud.style.display = "none";
}

// ============================================================
// PALETTE
// ============================================================
function buildPalette() {
  if (!engine) return;
  const container = document.getElementById("paletteContainer");
  if (!container) return;

  const parts = {};
  engine.questions.forEach(q => {
    if (!parts[q.TenPart]) parts[q.TenPart] = [];
    parts[q.TenPart].push(q);
  });

  container.innerHTML = Object.entries(parts).map(([part, qs]) => `
    <div class="palette-part-section">
      <div class="palette-part-label">Part ${part}</div>
      <div class="palette-grid">
        ${qs.map(q => `
          <button class="palette-btn" id="pal-${q.MaCauHoi}" data-stt="${q.STT}"
            onclick="jumpToQuestion(${q.STT})">${q.STT}</button>
        `).join("")}
      </div>
    </div>`).join("");
}

window.jumpToQuestion = function (stt) {
  engine?.goToSTT(stt);
};

function updatePaletteAnswered(qId) {
  const q = engine?.questions.find(x => String(x.MaCauHoi) === String(qId));
  if (!q) return;
  const btn = document.getElementById(`pal-${q.MaCauHoi}`);
  if (btn) btn.classList.add("answered");
}

function updatePaletteCurrent() {
  if (!engine) return;
  document.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("current"));
  engine.currentItem?.questions.forEach(q => {
    const btn = document.getElementById(`pal-${q.MaCauHoi}`);
    if (btn) btn.classList.add("current");
  });
}

// ============================================================
// TIMER
// ============================================================
function updateTimer(seconds) {
  const el = document.getElementById("timerDisplay");
  if (!el || !engine) return;
  el.textContent = engine.formatTime(seconds);
  el.className = "timer-display";
  if (seconds <= 300) el.classList.add("warning");
  if (seconds <= 60)  el.classList.add("danger");
}

// ============================================================
// EXAM CONTROLS
// ============================================================
function initExamControls() {
  document.getElementById("exitExamBtn")?.addEventListener("click", () => {
    if (!isReviewMode) {
      if (!confirm("Thoát sẽ không lưu bài làm. Bạn có chắc?")) return;
    }
    const targetTab = isReviewMode ? "history" : "library";
    engine?.stopTimer();
    stopAudio();
    clearInterval(countdownInterval);
    engine = null;
    isReviewMode = false;
    setTab(targetTab);
    hideExamArea();
  });

  document.getElementById("submitExamBtn")?.addEventListener("click", confirmSubmit);
  
  // Navigation for review mode
  document.getElementById("prevItemBtn")?.addEventListener("click", () => engine?.goPrev());
  document.getElementById("nextItemBtn")?.addEventListener("click", () => engine?.goNext());
}

function confirmSubmit() {
  if (!confirm(`Bạn đã trả lời ${engine?.answeredQs || 0}/${engine?.totalQs || 0} câu. Nộp bài?`)) return;
  doSubmit();
}

function autoSubmit() {
  doSubmit();
}

async function doSubmit() {
  if (!engine || !currentExamId) return;
  engine.stopTimer();
  stopAudio();
  clearInterval(countdownInterval);

  try {
    const payload = engine.buildSubmitPayload();
    const result = await submitExam(currentExamId, payload.answers, payload.selectedParts);

    lastResultSessionId = result.MaPhien;
    const total = result.TongDiem ?? result.DiemSo ?? 0;
    const lc = result.DiemLC ?? "--";
    const rc = result.DiemRC ?? "--";

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("finalScore", total);
    set("lcScore", lc);
    set("rcScore", rc);
    set("correctCount", `${result.SoCauDung ?? 0} đúng`);
    set("wrongCount", `${result.SoCauSai ?? 0} sai`);
    set("skipCount", `${result.SoCauKhongChon ?? 0} bỏ qua`);

    const greetings = ["Xuất sắc! 🏆", "Tuyệt vời! 🎉", "Rất tốt! 👏", "Cố gắng thêm! 💪"];
    set("resultGreeting", total >= 800 ? greetings[0] : total >= 600 ? greetings[1] : total >= 400 ? greetings[2] : greetings[3]);

    document.getElementById("resultModal").classList.add("active");

    await loadHistory();
    updateDashboard();
    await loadLibrary();
    renderLibrary("all");
  } catch (e) {
    console.error(e);
    alert("Có lỗi khi nộp bài. Vui lòng thử lại.");
  }
}

// ============================================================
// RESULT MODAL & REVIEW HISTORY
// ============================================================
function initResultModal() {
  document.getElementById("closeResultBtn")?.addEventListener("click", () => {
    document.getElementById("resultModal").classList.remove("active");
    setTab("library");
    hideExamArea();
  });
  document.getElementById("viewHistoryBtn")?.addEventListener("click", () => {
    document.getElementById("resultModal").classList.remove("active");
    if (lastResultSessionId) openHistoryDetail(lastResultSessionId);
  });
}

// Tái sử dụng màn làm bài để review
window.openHistoryDetail = async function (sessionId) {
  showExamArea();
  document.getElementById("questionDisplay").innerHTML = 
    `<div class="loading-state"><div class="loading-spinner"></div><p>Đang tải chi tiết bài làm...</p></div>`;

  // UI setups for Review Mode
  isReviewMode = true;
  document.getElementById("submitExamBtn").style.display = "none";
  document.getElementById("timerWidgetWrap").style.display = "none";
  document.getElementById("examNavActions").style.display = "flex";

  try {
    const data = await getSessionDetail(sessionId);

    const questions = data.chi_tiet;
    const answeredParts = [...new Set(questions.map(q => q.TenPart))];

    const examData = {
      TenDeThi: data.TenDeThi || "Chi tiết bài làm",
      ThoiGianLam: 0,
      questions: questions
    };

    engine = new ExamEngine(examData, answeredParts, false, 0, true);
    
    document.getElementById("examNameDisplay").textContent = examData.TenDeThi;
    document.getElementById("examModeBadge").textContent = "Xem Lịch Sử";

    engine.onItemChange = renderCurrentItem;
    buildPalette();
    renderCurrentItem();

    // Tô màu Palette phân biệt đúng / sai / bỏ qua
    engine.questions.forEach(q => {
      const btn = document.getElementById(`pal-${q.MaCauHoi}`);
      if (btn) {
        if (q.IsCorrect) btn.classList.add("correct");
        else if (q.DapAnChonId) btn.classList.add("wrong");
        else btn.classList.add("skip");
      }
    });

  } catch (e) {
    console.error(e);
    alert("❌ Không thể tải chi tiết. Vui lòng thử lại.");
    hideExamArea();
    setTab("history");
    isReviewMode = false;
  }
};

// ============================================================
// HELPERS
// ============================================================
function setTab(tabName) {
  const tabEl = document.querySelector(`.sidebar-menu li[data-tab="${tabName}"]`);
  if (tabEl) tabEl.click();
}