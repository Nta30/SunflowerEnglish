import {
  getAdminStats, getAdminUsers, createAdminUser, updateAdminUser,
  deleteAdminUser, toggleUserStatus,
  getAdminExams, createAdminExam, updateAdminExam, deleteAdminExam, toggleExamStatus,
  getExamQuestions, createQuestion, updateQuestion, deleteQuestion, getExamGroups,
  getFlashcardStats,
  uploadFile, createGroup
} from './api.js';
import { isLoggedIn } from './auth.js';

// Global state for admin panel
const State = {
  users: [],
  exams: [],
  questions: [],
  groups: [],
  currentExamId: null,
  currentExamName: '',
  pendingDeleteFn: null,
};

// init 
document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn() || localStorage.getItem('isAdmin') !== 'true') {
    alert('⛔ Bạn không có quyền truy cập!');
    window.location.href = 'index.html';
    return;
  }

  initAdminInfo();
  initNavigation();
  initClock();
  initModals();
  initSidebarToggle();
  initEventListeners();

  loadDashboard();
});

// admin info
function initAdminInfo() {
  try {
    const info = JSON.parse(localStorage.getItem('user_info'));
    if (info) {
      const name = info.fullname || info.username || 'Admin';
      document.getElementById('adminDisplayName').textContent = name;
      document.getElementById('settingAdminUsername').textContent = info.username || '—';
      document.getElementById('settingAdminFullname').textContent = info.fullname || '—';
    }
  } catch (e) { /* ignore */ }
}

// navigation and tab management
const TAB_META = {
  dashboard: { title: 'Bảng điều khiển', subtitle: 'Tổng quan hệ thống Sunflower English', loader: loadDashboard },
  users: { title: 'Quản lý Người dùng', subtitle: 'Quản lý tài khoản học viên trên hệ thống', loader: loadUsers },
  exams: { title: 'Quản lý Đề thi', subtitle: 'Tạo, chỉnh sửa và quản lý kho đề thi TOEIC', loader: loadExams },
  flashcards: { title: 'Thống kê Flashcard', subtitle: 'Xem thống kê bộ từ vựng của học viên', loader: loadFlashcardStats },
  settings: { title: 'Cài đặt hệ thống', subtitle: 'Thông tin và cấu hình hệ thống', loader: loadSettings },
};

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      const meta = TAB_META[tab];
      if (!meta) return;

      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById('pageTitle').textContent = meta.title;
      document.getElementById('pageSubtitle').textContent = meta.subtitle;

      // Close sidebar on mobile
      document.getElementById('adminSidebar').classList.remove('open');

      meta.loader();
    });
  });

  // Logout
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
  });
}

function initSidebarToggle() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (toggle) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// live clock
function initClock() {
  const el = document.getElementById('liveClock');
  function update() {
    const now = new Date();
    el.textContent = now.toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  update();
  setInterval(update, 30000);
}


// modals
function initModals() {
  // Close modal buttons
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      closeModal(id);
    });
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
    }
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// event listeners for admin actions
function initEventListeners() {
  // User form
  document.getElementById('btnAddUser').addEventListener('click', () => openUserModal());
  document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

  // Exam form
  document.getElementById('btnAddExam').addEventListener('click', () => openExamModal());
  document.getElementById('examForm').addEventListener('submit', handleExamFormSubmit);

  // Question form
  document.getElementById('btnAddQuestion').addEventListener('click', () => openQuestionModal());
  document.getElementById('questionForm').addEventListener('submit', handleQuestionFormSubmit);
  document.getElementById('qFormPart').addEventListener('change', handlePartChange);
  document.getElementById('btnAddSubQuestion').addEventListener('click', () => addSubQuestionForm());

  // Back from question editor
  document.getElementById('btnBackToExams').addEventListener('click', () => {
    document.getElementById('examListView').style.display = '';
    document.getElementById('questionEditorView').style.display = 'none';
  });

  // Confirm delete
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (State.pendingDeleteFn) State.pendingDeleteFn();
    closeModal('confirmModal');
  });

  // Search
  document.getElementById('userSearchInput').addEventListener('input', debounce(filterUsers, 300));
  document.getElementById('examSearchInput').addEventListener('input', debounce(filterExams, 300));

  // Upload zones
  initUploadZones();
}


// dashboard
async function loadDashboard() {
  try {
    const stats = await getAdminStats();

    animateCounter('statUsers', stats.total_users);
    animateCounter('statSessions', stats.total_sessions);
    animateCounter('statAvgScore', stats.avg_score);
    animateCounter('statFlashcards', stats.total_flashcards);

    // Recent activities
    const tbody = document.getElementById('recentActivityBody');
    if (stats.recent_activities && stats.recent_activities.length > 0) {
      tbody.innerHTML = stats.recent_activities.map(a => `
        <tr>
          <td><strong>${esc(a.user)}</strong></td>
          <td>${esc(a.action)}</td>
          <td style="color:var(--admin-text-muted)">${esc(a.time)}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Chưa có hoạt động nào</td></tr>';
    }

    // Top exams
    const topList = document.getElementById('topExamsList');
    if (stats.top_exams && stats.top_exams.length > 0) {
      topList.innerHTML = stats.top_exams.map(e => `
        <li>
          <span>${esc(e.name)}</span>
          <span class="exam-count">${e.count} lượt</span>
        </li>
      `).join('');
    } else {
      topList.innerHTML = '<li class="empty-state">Chưa có dữ liệu</li>';
    }

    // Update settings tab counters
    document.getElementById('settingExamCount').textContent = stats.total_exams || 0;
    document.getElementById('settingUserCount').textContent = stats.total_users || 0;

  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Không thể tải thống kê!', 'error');
  }
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800;
  const start = performance.now();

  el.classList.add('animated');
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('vi-VN');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


// users
async function loadUsers() {
  try {
    const users = await getAdminUsers();
    State.users = users;
    renderUsers(users);
  } catch (err) {
    console.error('Users load error:', err);
    showToast('Không thể tải danh sách người dùng!', 'error');
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có học viên nào</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>U${u.id}</strong></td>
      <td>${esc(u.fullname || 'Chưa cập nhật')}</td>
      <td>${esc(u.username)}</td>
      <td>${esc(u.email || '—')}</td>
      <td>
        <span class="badge ${u.status === 1 ? 'badge-success' : 'badge-danger'}">
          ${u.status === 1 ? 'Hoạt động' : 'Bị khoá'}
        </span>
      </td>
      <td style="color:var(--admin-text-muted)">${esc(u.created_at || '')}</td>
      <td>
        <div class="action-group">
          <button class="action-btn edit" title="Sửa" onclick="window._adminEditUser(${u.id})">✏️</button>
          <button class="action-btn toggle" title="${u.status === 1 ? 'Khoá' : 'Mở khoá'}" onclick="window._adminToggleUser(${u.id})">
            ${u.status === 1 ? '🔒' : '🔓'}
          </button>
          <button class="action-btn delete" title="Xoá" onclick="window._adminDeleteUser(${u.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const q = document.getElementById('userSearchInput').value.toLowerCase();
  const filtered = State.users.filter(u =>
    (u.fullname || '').toLowerCase().includes(q) ||
    (u.username || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
  renderUsers(filtered);
}

function openUserModal(user = null) {
  const isEdit = !!user;
  document.getElementById('userModalTitle').textContent = isEdit ? 'Cập nhật học viên' : 'Thêm học viên mới';
  document.getElementById('userFormId').value = isEdit ? user.id : '';
  document.getElementById('userFormFullname').value = isEdit ? (user.fullname || '') : '';
  document.getElementById('userFormUsername').value = isEdit ? user.username : '';
  document.getElementById('userFormUsername').disabled = isEdit;
  document.getElementById('userFormEmail').value = isEdit ? (user.email || '') : '';
  document.getElementById('userFormPassword').value = '';
  document.getElementById('userFormPassword').required = !isEdit;
  document.getElementById('passwordHint').textContent = isEdit ? '(Để trống nếu không đổi)' : '';
  openModal('userModal');
}

async function handleUserFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('userFormId').value;
  const data = {
    fullname: document.getElementById('userFormFullname').value.trim(),
    username: document.getElementById('userFormUsername').value.trim(),
    email: document.getElementById('userFormEmail').value.trim(),
    password: document.getElementById('userFormPassword').value,
  };

  try {
    let result;
    if (id) {
      result = await updateAdminUser(id, data);
    } else {
      if (!data.username || !data.password) {
        showToast('Tên tài khoản và mật khẩu là bắt buộc!', 'warning');
        return;
      }
      result = await createAdminUser(data);
    }
    showToast(result.message, 'success');
    closeModal('userModal');
    await loadUsers();
  } catch (err) {
    showToast('Có lỗi xảy ra!', 'error');
  }
}

// Global handlers for inline onclick
window._adminEditUser = function (id) {
  const user = State.users.find(u => u.id === id);
  if (user) openUserModal(user);
};

window._adminToggleUser = async function (id) {
  try {
    const result = await toggleUserStatus(id);
    showToast(result.message, 'success');
    await loadUsers();
  } catch (err) {
    showToast('Có lỗi xảy ra!', 'error');
  }
};

window._adminDeleteUser = function (id) {
  document.getElementById('confirmTitle').textContent = 'Xoá người dùng';
  document.getElementById('confirmMessage').textContent = `Bạn có chắc chắn muốn xoá người dùng U${id}? Tất cả dữ liệu liên quan sẽ bị mất.`;
  State.pendingDeleteFn = async () => {
    try {
      const result = await deleteAdminUser(id);
      showToast(result.message, 'success');
      await loadUsers();
    } catch (err) {
      showToast('Có lỗi xảy ra!', 'error');
    }
  };
  openModal('confirmModal');
};


// exams
async function loadExams() {
  // Reset to list view
  document.getElementById('examListView').style.display = '';
  document.getElementById('questionEditorView').style.display = 'none';

  try {
    const exams = await getAdminExams();
    State.exams = exams;
    renderExams(exams);
  } catch (err) {
    console.error('Exams load error:', err);
    showToast('Không thể tải danh sách đề thi!', 'error');
  }
}

function renderExams(exams) {
  const tbody = document.getElementById('examsTableBody');
  if (!exams || exams.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có đề thi nào</td></tr>';
    return;
  }

  tbody.innerHTML = exams.map(e => `
    <tr>
      <td><strong>E${e.id}</strong></td>
      <td>${esc(e.name)}</td>
      <td>${e.duration} phút</td>
      <td>${e.question_count}</td>
      <td>${e.session_count}</td>
      <td>
        <span class="badge ${e.status === 1 ? 'badge-info' : 'badge-warning'}">
          ${e.status === 1 ? 'Công khai' : 'Bản nháp'}
        </span>
      </td>
      <td>
        <div class="action-group">
          <button class="action-btn edit" title="Sửa thông tin" onclick="window._adminEditExam(${e.id})">✏️</button>
          <button class="action-btn questions" title="Quản lý câu hỏi" onclick="window._adminManageQuestions(${e.id}, '${esc(e.name)}')">📋</button>
          <button class="action-btn toggle" title="${e.status === 1 ? 'Ẩn đề' : 'Công khai'}" onclick="window._adminToggleExam(${e.id})">
            ${e.status === 1 ? '🔒' : '🌐'}
          </button>
          <button class="action-btn delete" title="Xoá" onclick="window._adminDeleteExam(${e.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterExams() {
  const q = document.getElementById('examSearchInput').value.toLowerCase();
  const filtered = State.exams.filter(e =>
    (e.name || '').toLowerCase().includes(q)
  );
  renderExams(filtered);
}

function openExamModal(exam = null) {
  const isEdit = !!exam;
  document.getElementById('examModalTitle').textContent = isEdit ? 'Cập nhật đề thi' : 'Tạo đề thi mới';
  document.getElementById('examFormId').value = isEdit ? exam.id : '';
  document.getElementById('examFormName').value = isEdit ? exam.name : '';
  document.getElementById('examFormDesc').value = isEdit ? (exam.description || '') : '';
  document.getElementById('examFormDuration').value = isEdit ? exam.duration : 120;
  openModal('examModal');
}

async function handleExamFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('examFormId').value;
  const data = {
    name: document.getElementById('examFormName').value.trim(),
    description: document.getElementById('examFormDesc').value.trim(),
    duration: document.getElementById('examFormDuration').value,
  };

  if (!data.name) {
    showToast('Tên đề thi là bắt buộc!', 'warning');
    return;
  }

  try {
    let result;
    if (id) {
      result = await updateAdminExam(id, data);
    } else {
      result = await createAdminExam(data);
    }
    showToast(result.message, 'success');
    closeModal('examModal');
    await loadExams();
  } catch (err) {
    showToast('Có lỗi xảy ra!', 'error');
  }
}

window._adminEditExam = function (id) {
  const exam = State.exams.find(e => e.id === id);
  if (exam) openExamModal(exam);
};

window._adminToggleExam = async function (id) {
  try {
    const result = await toggleExamStatus(id);
    showToast(result.message, 'success');
    await loadExams();
  } catch (err) {
    showToast('Có lỗi xảy ra!', 'error');
  }
};

window._adminDeleteExam = function (id) {
  document.getElementById('confirmTitle').textContent = 'Xoá đề thi';
  document.getElementById('confirmMessage').textContent = `Xoá đề thi E${id}? Tất cả câu hỏi và lịch sử làm bài liên quan sẽ bị mất.`;
  State.pendingDeleteFn = async () => {
    try {
      const result = await deleteAdminExam(id);
      showToast(result.message, 'success');
      await loadExams();
    } catch (err) {
      showToast('Có lỗi xảy ra!', 'error');
    }
  };
  openModal('confirmModal');
};

window._adminManageQuestions = function (examId, examName) {
  State.currentExamId = examId;
  State.currentExamName = examName;
  document.getElementById('editorExamName').textContent = `Đề thi: ${examName}`;
  document.getElementById('examListView').style.display = 'none';
  document.getElementById('questionEditorView').style.display = '';
  loadQuestions(examId);
};


// questions
async function loadQuestions(examId) {
  const grid = document.getElementById('questionsGrid');
  grid.innerHTML = '<div class="empty-state-box">Đang tải câu hỏi...</div>';

  try {
    const [questions, groups] = await Promise.all([
      getExamQuestions(examId),
      getExamGroups(examId)
    ]);
    State.questions = questions;
    State.groups = groups;
    renderQuestions(questions);
  } catch (err) {
    console.error('Questions load error:', err);
    grid.innerHTML = '<div class="empty-state-box">Không thể tải câu hỏi</div>';
  }
}

function renderQuestions(questions) {
  const grid = document.getElementById('questionsGrid');
  if (!questions || questions.length === 0) {
    grid.innerHTML = '<div class="empty-state-box">Đề thi chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</div>';
    return;
  }

  grid.innerHTML = questions.map(q => {
    const answersHtml = (q.answers || []).map(a =>
      `<span class="answer-pill ${a.is_correct ? 'correct' : ''}">${esc(a.label)}. ${esc(a.content ? a.content.substring(0, 30) : '')}${a.is_correct ? ' ✓' : ''}</span>`
    ).join('');

    return `
      <div class="question-card">
        <div class="question-card-left">
          <span class="question-card-num">${q.stt}</span>
          <span class="question-card-part">Part ${q.part}</span>
          ${q.group_id ? `<span class="badge badge-warning" style="margin-left:8px;font-size:11px">Nhóm ${q.group_id}</span>` : ''}
          ${q.audio_url ? `<span class="badge badge-info" style="margin-left:8px;font-size:11px">🎵 Audio</span>` : ''}
          ${q.image_url ? `<span class="badge badge-success" style="margin-left:8px;font-size:11px">🖼️ Ảnh</span>` : ''}
          <div class="question-card-content">${esc(q.content || '(Câu hỏi không có nội dung text)')}</div>
          <div class="question-card-answers">${answersHtml}</div>
          ${q.explanation ? `<div style="margin-top: 8px; font-size: 13px; color: var(--admin-text-secondary); background: var(--admin-bg); padding: 8px; border-radius: 6px; border-left: 3px solid var(--admin-accent);"><strong>Giải thích:</strong> ${esc(q.explanation)}</div>` : ''}
        </div>
        <div class="question-card-right">
          <button class="action-btn edit" title="Sửa" onclick="window._adminEditQuestion(${q.id})">✏️</button>
          <button class="action-btn delete" title="Xoá" onclick="window._adminDeleteQuestion(${q.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function handlePartChange() {
  const part = parseInt(document.getElementById('qFormPart').value);
  const isGroup = [3, 4, 6, 7].includes(part);
  
  const singleMediaSection = document.getElementById('singleMediaSection');
  const groupMediaSection = document.getElementById('groupMediaSection');
  const btnAddSubQuestion = document.getElementById('btnAddSubQuestion');
  const subQuestionsContainer = document.getElementById('subQuestionsContainer');
  const subQuestionsTitle = document.getElementById('subQuestionsTitle');

  if (isGroup) {
    singleMediaSection.style.display = 'none';
    groupMediaSection.style.display = 'block';
    btnAddSubQuestion.style.display = 'inline-block';
    subQuestionsTitle.textContent = 'Các câu hỏi trong nhóm';
    
    // Show correct group media
    document.getElementById('grpAudioGroup').style.display = [3, 4].includes(part) ? 'block' : 'none';
    document.getElementById('grpImageGroup').style.display = 'block'; // Tất cả part nhóm đều có thể có ảnh
  } else {
    singleMediaSection.style.display = 'block';
    groupMediaSection.style.display = 'none';
    btnAddSubQuestion.style.display = 'none';
    subQuestionsTitle.textContent = 'Nội dung câu hỏi';
    
    // Show correct single media
    document.getElementById('qSingleAudioGroup').style.display = [1, 2].includes(part) ? 'block' : 'none';
    document.getElementById('qSingleImageGroup').style.display = [1].includes(part) ? 'block' : 'none';
  }
}

function openQuestionModal(question = null) {
  const isEdit = !!question;
  document.getElementById('questionModalTitle').textContent = isEdit ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi';
  document.getElementById('qFormId').value = isEdit ? question.id : '';
  
  const partSelect = document.getElementById('qFormPart');
  partSelect.value = isEdit ? question.part : 1;
  partSelect.disabled = isEdit; // Ngăn đổi Part khi đang sửa
  
  // Clear forms
  document.getElementById('subQuestionsContainer').innerHTML = '';
  
  if (isEdit) {
    // Sửa câu hỏi độc lập (luôn chỉ 1 sub-form)
    handlePartChange();
    document.getElementById('groupMediaSection').style.display = 'none'; // Không sửa media nhóm ở đây
    document.getElementById('subQuestionsTitle').textContent = 'Nội dung câu hỏi';
    document.getElementById('btnAddSubQuestion').style.display = 'none';
    
    addSubQuestionForm(question);
    
    // Reset & set single media (if part 1,2)
    document.getElementById('qFormAudio').value = question.audio_url || '';
    document.getElementById('qFormImage').value = question.image_url || '';
    resetUploadZone('qAudioZone', 'qAudioPreview');
    resetUploadZone('qImageZone', 'qImagePreview');
    if (question.audio_url) {
      showPreview('qAudioPreview', 'audio', question.audio_url);
      document.getElementById('qAudioZone').style.display = 'none';
    }
    if (question.image_url) {
      showPreview('qImagePreview', 'image', question.image_url);
      document.getElementById('qImageZone').style.display = 'none';
    }
  } else {
    // Thêm mới
    handlePartChange();
    resetUploadZone('qAudioZone', 'qAudioPreview');
    resetUploadZone('qImageZone', 'qImagePreview');
    resetUploadZone('grpAudioZone', 'grpAudioPreview');
    document.getElementById('grpImagesPreview').innerHTML = '';
    State.pendingGroupImages = [];
    State.pendingGroupAudioFile = null;
    State.pendingAudioFile = null;
    State.pendingImageFile = null;
    
    document.getElementById('qFormAudio').value = '';
    document.getElementById('qFormImage').value = '';
    document.getElementById('grpAudioUrl').value = '';
    
    addSubQuestionForm(); // Init with 1 form
  }

  openModal('questionModal');
}

let subQuestionCounter = 0;
function addSubQuestionForm(question = null) {
  const container = document.getElementById('subQuestionsContainer');
  const isEdit = !!question;
  subQuestionCounter++;
  
  const sttValue = isEdit ? question.stt : (State.questions.length + subQuestionCounter);
  const content = isEdit ? (question.content || '') : '';
  const explanation = isEdit ? (question.explanation || '') : '';
  
  // Create answer inputs
  const labels = ['A', 'B', 'C', 'D'];
  const ansData = {};
  if (isEdit && question.answers) {
    question.answers.forEach(a => {
      ansData[a.label] = { content: a.content || '', isCorrect: a.is_correct };
    });
  }

  const ansHtml = labels.map(l => {
    const isChecked = ansData[l] ? ansData[l].isCorrect : (l === 'A');
    const val = ansData[l] ? ansData[l].content : '';
    return `
      <div class="answer-row">
        <input type="radio" name="sqCorrect_${subQuestionCounter}" value="${l}" ${isChecked ? 'checked' : ''} />
        <span class="answer-label">${l}</span>
        <input type="text" class="sq-ans" data-label="${l}" placeholder="Nội dung đáp án ${l}" value="${esc(val)}" />
      </div>
    `;
  }).join('');

  const html = `
    <div class="sub-question-card" id="sqCard_${subQuestionCounter}">
      <div class="sub-question-header">
        <span>Câu ${sttValue}</span>
        ${!isEdit && container.children.length > 0 ? `<button type="button" class="btn-remove-sub-question" onclick="document.getElementById('sqCard_${subQuestionCounter}').remove()">Xoá câu này</button>` : ''}
      </div>
      <div class="form-row">
        <div class="form-group" style="width: 100px;">
          <label>STT</label>
          <input type="number" class="sq-stt" min="1" value="${sttValue}" required />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Giải thích</label>
          <input type="text" class="sq-exp" placeholder="Giải thích đáp án..." value="${esc(explanation)}" />
        </div>
      </div>
      <div class="form-group">
        <label>Nội dung câu hỏi</label>
        <textarea class="sq-content" rows="2" placeholder="Nội dung câu hỏi (có thể trống)...">${esc(content)}</textarea>
      </div>
      <div class="answers-section">
        <label>Đáp án (chọn đáp án đúng)</label>
        ${ansHtml}
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

async function handleQuestionFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveQuestion');
  
  // Thu thập dữ liệu các sub-questions
  const cards = document.querySelectorAll('.sub-question-card');
  if (cards.length === 0) return;
  
  btn.disabled = true;
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loading').style.display = '';

  const part = parseInt(document.getElementById('qFormPart').value);
  const isGroup = [3, 4, 6, 7].includes(part);
  const isEdit = document.getElementById('qFormId').value !== '';

  try {
    let groupId = null;
    let singleAudioUrl = null;
    let singleImageUrl = null;

    // ----- XỬ LÝ UPLOAD NẾU THÊM MỚI -----
    if (!isEdit) {
      if (isGroup) {
        // Create Group First
        showToast('Đang tạo nhóm và upload media...', 'info');
        const formData = new FormData();
        if (State.pendingGroupAudioFile) {
          formData.append('audio_file', State.pendingGroupAudioFile);
        }
        if (State.pendingGroupImages && State.pendingGroupImages.length > 0) {
          State.pendingGroupImages.forEach(file => {
            if (file) formData.append('image_files', file);
          });
        }
        
        // Gọi API tạo nhóm
        const resObj = await createGroup(formData);
        if (!resObj.group) {
          throw new Error(resObj.message || 'Lỗi tạo nhóm');
        }
        groupId = resObj.group.id;
        
      } else {
        // Single upload
        if (State.pendingAudioFile) {
          showToast('Đang upload audio...', 'info');
          const res = await uploadFile(State.pendingAudioFile, 'audio');
          if (!res.url) throw new Error(res.message);
          singleAudioUrl = res.url;
        }
        if (State.pendingImageFile) {
          showToast('Đang upload ảnh...', 'info');
          const res = await uploadFile(State.pendingImageFile, 'image');
          if (!res.url) throw new Error(res.message);
          singleImageUrl = res.url;
        }
      }
    }

    // ----- TẠO HOẶC CẬP NHẬT CÁC CÂU HỎI -----
    let successCount = 0;
    
    for (const card of cards) {
      const stt = card.querySelector('.sq-stt').value;
      const content = card.querySelector('.sq-content').value.trim();
      const exp = card.querySelector('.sq-exp').value.trim();
      
      const correctLabel = card.querySelector('input[type="radio"]:checked').value;
      const answers = ['A', 'B', 'C', 'D'].map(l => ({
        label: l,
        content: card.querySelector(`.sq-ans[data-label="${l}"]`).value.trim(),
        is_correct: l === correctLabel
      }));

      const payload = {
        stt: stt,
        part: part,
        content: content,
        explanation: exp,
        answers: answers
      };

      if (!isEdit) {
        if (isGroup) {
          payload.group_id = groupId;
        } else {
          payload.audio_url = singleAudioUrl || document.getElementById('qFormAudio').value;
          payload.image_url = singleImageUrl || document.getElementById('qFormImage').value;
        }
        await createQuestion(State.currentExamId, payload);
      } else {
        // Edit mode (only 1 card)
        const qId = document.getElementById('qFormId').value;
        // Keep existing single media
        payload.audio_url = document.getElementById('qFormAudio').value;
        payload.image_url = document.getElementById('qFormImage').value;
        // Not touching group_id
        await updateQuestion(qId, payload);
      }
      successCount++;
    }

    showToast(`Đã lưu ${successCount} câu hỏi thành công!`, 'success');
    closeModal('questionModal');
    await loadQuestions(State.currentExamId);

  } catch (err) {
    showToast(err.message || 'Có lỗi xảy ra!', 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.btn-loading').style.display = 'none';
  }
}

window._adminEditQuestion = function (id) {
  const q = State.questions.find(x => x.id === id);
  if (q) openQuestionModal(q);
};

window._adminDeleteQuestion = function (id) {
  document.getElementById('confirmTitle').textContent = 'Xoá câu hỏi';
  document.getElementById('confirmMessage').textContent = 'Bạn có chắc chắn muốn xoá câu hỏi này?';
  State.pendingDeleteFn = async () => {
    try {
      const result = await deleteQuestion(id);
      showToast(result.message, 'success');
      await loadQuestions(State.currentExamId);
    } catch (err) {
      showToast('Có lỗi xảy ra!', 'error');
    }
  };
  openModal('confirmModal');
};

// file uploads
function initUploadZones() {
  // Single-file upload zones (question audio/image)
  document.querySelectorAll('.upload-zone[data-target]').forEach(zone => {
    const fileInput = zone.querySelector('.upload-input');
    const type = zone.dataset.type;
    const targetId = zone.dataset.target;
    const previewId = zone.dataset.preview;

    // Drag events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleSingleFileSelect(file, type, targetId, previewId, zone);
    });

    // Click/file select
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleSingleFileSelect(file, type, targetId, previewId, zone);
      fileInput.value = ''; // reset so same file can be re-selected
    });
  });

  // Multi-image upload zone (group images)
  const grpImagesZone = document.getElementById('grpImagesZone');
  if (grpImagesZone) {
    const fileInput = grpImagesZone.querySelector('.upload-input');

    grpImagesZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      grpImagesZone.classList.add('dragover');
    });
    grpImagesZone.addEventListener('dragleave', () => grpImagesZone.classList.remove('dragover'));
    grpImagesZone.addEventListener('drop', (e) => {
      e.preventDefault();
      grpImagesZone.classList.remove('dragover');
      handleMultiImageSelect(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
      handleMultiImageSelect(fileInput.files);
      fileInput.value = '';
    });
  }

  // Remove upload buttons
  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-upload');
    if (removeBtn) {
      const preview = removeBtn.closest('.upload-preview');
      if (preview) {
        const zone = preview.previousElementSibling || document.getElementById(preview.id.replace('Preview', 'Zone'));
        preview.style.display = 'none';
        // Clear the hidden input
        const audio = preview.querySelector('.preview-audio');
        if (audio) audio.src = '';
        const img = preview.querySelector('.preview-image');
        if (img) img.src = '';

        // Show the upload zone again
        if (preview.id === 'qAudioPreview') {
          document.getElementById('qAudioZone').style.display = '';
          document.getElementById('qFormAudio').value = '';
          State.pendingAudioFile = null;
        }
        if (preview.id === 'qImagePreview') {
          document.getElementById('qImageZone').style.display = '';
          document.getElementById('qFormImage').value = '';
          State.pendingImageFile = null;
        }
        if (preview.id === 'grpAudioPreview') {
          document.getElementById('grpAudioZone').style.display = '';
          document.getElementById('grpAudioUrl').value = '';
          State.pendingGroupAudioFile = null;
        }
      }
    }
  });
}

function handleSingleFileSelect(file, type, targetId, previewId, zone) {
  // Store file for later upload
  if (targetId === 'qFormAudio') State.pendingAudioFile = file;
  if (targetId === 'qFormImage') State.pendingImageFile = file;
  if (targetId === 'grpAudioUrl') State.pendingGroupAudioFile = file;

  // Create local preview
  const url = URL.createObjectURL(file);
  showPreview(previewId, type, url);
  zone.style.display = 'none';
}

function showPreview(previewId, type, url) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.style.display = 'flex';

  if (type === 'audio') {
    const audio = preview.querySelector('.preview-audio');
    if (audio) audio.src = url;
  } else {
    const img = preview.querySelector('.preview-image');
    if (img) img.src = url;
  }
}

function resetUploadZone(zoneId, previewId) {
  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);
  if (zone) zone.style.display = '';
  if (preview) {
    preview.style.display = 'none';
    const audio = preview.querySelector('.preview-audio');
    if (audio) audio.src = '';
    const img = preview.querySelector('.preview-image');
    if (img) img.src = '';
  }
}

// Multi-image handling for group
function handleMultiImageSelect(files) {
  if (!State.pendingGroupImages) State.pendingGroupImages = [];
  const previewGrid = document.getElementById('grpImagesPreview');

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    State.pendingGroupImages.push(file);
    const url = URL.createObjectURL(file);
    const idx = State.pendingGroupImages.length - 1;

    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    thumb.dataset.idx = idx;
    thumb.innerHTML = `
      <img src="${url}" alt="Preview" />
      <button type="button" class="remove-thumb" onclick="window._removeGroupImage(${idx})">✕</button>
    `;
    previewGrid.appendChild(thumb);
  });
}

// Remove group form listeners since we merged it handleMultiImageSelect
window._removeGroupImage = function(idx) {
  if (State.pendingGroupImages) State.pendingGroupImages[idx] = null;
  const thumb = document.querySelector(`.preview-thumb[data-idx="${idx}"]`);
  if (thumb) thumb.remove();
};

// ══════════════════════════════════════════
//  FLASHCARD STATS (Read-only)
// ══════════════════════════════════════════

async function loadFlashcardStats() {
  try {
    const stats = await getFlashcardStats();

    animateCounter('fcStatDecks', stats.total_decks);
    animateCounter('fcStatCards', stats.total_cards);

    const topUser = stats.top_users && stats.top_users[0];
    document.getElementById('fcTopUser').textContent = topUser
      ? `${topUser.name} (${topUser.deck_count} bộ)`
      : 'Chưa có';

    // Render decks table
    const tbody = document.getElementById('fcDecksBody');
    if (stats.decks && stats.decks.length > 0) {
      tbody.innerHTML = stats.decks.map(d => `
        <tr>
          <td style="font-size:24px">${esc(d.icon || '🌱')}</td>
          <td><strong>${esc(d.title)}</strong></td>
          <td>${esc(d.user)}</td>
          <td>${d.card_count} thẻ</td>
          <td style="color:var(--admin-text-muted)">${esc(d.created_at)}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Chưa có bộ từ nào</td></tr>';
    }
  } catch (err) {
    console.error('Flashcard stats error:', err);
    showToast('Không thể tải thống kê Flashcard!', 'error');
  }
}


// settings
function loadSettings() {}

// ultils
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}