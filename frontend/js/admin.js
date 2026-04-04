const mockUsers = [
  {
    id: "U001",
    name: "Nguyễn Văn A",
    email: "nva@gmail.com",
    status: "active",
    statusText: "Hoạt động",
  },
  {
    id: "U002",
    name: "Trần Thị B",
    email: "ttb@gmail.com",
    status: "locked",
    statusText: "Bị khóa",
  },
  {
    id: "U003",
    name: "Lê Văn C",
    email: "lvc@gmail.com",
    status: "active",
    statusText: "Hoạt động",
  },
];

const mockExams = [
  {
    id: "EX01",
    name: "ETS TOEIC 2024 Test 1",
    questions: 200,
    views: 1250,
    status: "public",
    statusText: "Công khai",
  },
  {
    id: "EX02",
    name: "Hacker TOEIC LC",
    questions: 100,
    views: 840,
    status: "public",
    statusText: "Công khai",
  },
  {
    id: "EX03",
    name: "Mini Test Reading",
    questions: 30,
    views: 0,
    status: "draft",
    statusText: "Bản nháp",
  },
];

const mockActivities = [
  {
    user: "Nguyễn Văn A",
    action: "Hoàn thành Đề EX01 (820đ)",
    time: "5 phút trước",
  },
  { user: "Trần Thị B", action: "Tạo tài khoản mới", time: "1 giờ trước" },
  { user: "Lê Văn C", action: "Lưu 15 từ vựng mới", time: "2 giờ trước" },
];

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".admin-menu li");
  const panes = document.querySelectorAll(".admin-tab-pane");
  const mainHeaderTitle = document.getElementById("mainHeaderTitle");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.tab);
      targetPane.classList.add("active");

      mainHeaderTitle.innerText =
        tab.innerText
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s/g, "")
          .replace(/^[^\w\sÀ-ỹ]+/g, "")
          .trim() || tab.innerText.substring(2).trim();

      if (tab.dataset.tab === "tab-exams") {
        document.getElementById("examListView").style.display = "block";
        document.getElementById("examBuilderView").style.display = "none";
      }
    });
  });

  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isAdmin");
      window.location.href = "index.html";
    });
  }

  const recentActivityTable = document.getElementById("recentActivityTable");
  if (recentActivityTable) {
    mockActivities.forEach((act) => {
      recentActivityTable.innerHTML += `
        <tr>
          <td>${act.user}</td>
          <td>${act.action}</td>
          <td style="color: #A3AED0;">${act.time}</td>
        </tr>
      `;
    });
  }

  const topExamsList = document.getElementById("topExamsList");
  if (topExamsList) {
    const sortedExams = [...mockExams]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
    sortedExams.forEach((ex) => {
      topExamsList.innerHTML += `
        <li>
          <span>${ex.name}</span>
          <span>${ex.views} lượt</span>
        </li>
      `;
    });
  }

  const usersTableBody = document.getElementById("usersTableBody");
  if (usersTableBody) {
    mockUsers.forEach((user) => {
      usersTableBody.innerHTML += `
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td><span class="status-badge status-${user.status}">${user.statusText}</span></td>
          <td>
            <button class="action-btn edit" onclick="openCrudModal('user', '${user.id}')">✏️</button>
            <button class="action-btn delete" onclick="deleteItem('${user.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
  }

  const examsTableBody = document.getElementById("examsTableBody");
  if (examsTableBody) {
    mockExams.forEach((exam) => {
      examsTableBody.innerHTML += `
        <tr>
          <td>${exam.id}</td>
          <td>${exam.name}</td>
          <td>${exam.questions}</td>
          <td>${exam.views}</td>
          <td><span class="status-badge status-${exam.status}">${exam.statusText}</span></td>
          <td>
            <button class="action-btn edit" onclick="openExamBuilder()">✏️</button>
            <button class="action-btn delete" onclick="deleteItem('${exam.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
  }

  const builderPartBtns = document.querySelectorAll(".part-nav-btn");
  builderPartBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      builderPartBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      renderBuilderPart(e.target.getAttribute("data-build-part"));
    });
  });

  const crudForm = document.getElementById("crudForm");
  if (crudForm) {
    crudForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Dữ liệu đã được lưu thành công! 🌱");
      closeCrudModal();
    });
  }
});

window.openCrudModal = function (type, id = null) {
  const modal = document.getElementById("crudModal");
  const title = document.getElementById("crudModalTitle");
  const fields = document.getElementById("crudFormFields");
  fields.innerHTML = "";

  if (type === "user") {
    title.innerText = id ? `Cập nhật Học viên: ${id}` : "Thêm Học viên mới";
    fields.innerHTML = `
      <div class="admin-input-group">
        <label>Họ và Tên</label>
        <input type="text" required placeholder="Nhập họ tên...">
      </div>
      <div class="admin-input-group">
        <label>Email</label>
        <input type="email" required placeholder="Nhập email...">
      </div>
      <div class="admin-input-group">
        <label>Mật khẩu</label>
        <input type="password" required placeholder="Nhập mật khẩu...">
      </div>
      <div class="admin-input-group">
        <label>Trạng thái</label>
        <select>
          <option value="active">Hoạt động</option>
          <option value="locked">Khóa tài khoản</option>
        </select>
      </div>
    `;
  }
  modal.classList.add("active");
};

window.closeCrudModal = function () {
  document.getElementById("crudModal").classList.remove("active");
};

window.deleteItem = function (id) {
  if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ${id} không?`)) {
    alert("Đã xóa thành công!");
  }
};

window.openExamBuilder = function () {
  document.getElementById("examListView").style.display = "none";
  document.getElementById("examBuilderView").style.display = "block";
  document.querySelector(".exam-title-input").value = "";
  document.querySelector('.part-nav-btn[data-build-part="1"]').click();
  window.scrollTo(0, 0);
};

window.closeExamBuilder = function () {
  if (confirm("Những thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn thoát?")) {
    document.getElementById("examListView").style.display = "block";
    document.getElementById("examBuilderView").style.display = "none";
  }
};

window.saveExam = function () {
  const title = document.querySelector(".exam-title-input").value;
  if (!title) {
    alert("Vui lòng nhập Tên đề thi!");
    return;
  }
  alert("Đề thi đã được lưu thành công vào cơ sở dữ liệu! 🌻");
  document.getElementById("examListView").style.display = "block";
  document.getElementById("examBuilderView").style.display = "none";
};

let currentQuestionNum = 1;

function renderBuilderPart(partNum) {
  const area = document.getElementById("builderContentArea");
  area.innerHTML = "";

  const partTitles = {
    1: "Photographs",
    2: "Question-Response",
    3: "Conversations",
    4: "Talks",
    5: "Incomplete Sentences",
    6: "Text Completion",
    7: "Reading Comprehension",
  };

  area.innerHTML += `<h3 class="part-title-header">Part ${partNum}: ${partTitles[partNum]}</h3>`;
  area.innerHTML += `<p class="part-desc-header">Thêm và chỉnh sửa các câu hỏi thuộc Part ${partNum} tại đây.</p>`;

  const questionsWrapper = document.createElement("div");
  questionsWrapper.id = "questionsWrapper";
  area.appendChild(questionsWrapper);

  if (["6", "7"].includes(partNum)) {
    addPassageBlock(partNum);
  } else {
    addQuestionBlock(partNum);
  }

  const addBtn = document.createElement("button");
  addBtn.className = "btn-add-question";
  addBtn.innerText = ["6", "7"].includes(partNum)
    ? "+ Thêm Nhóm câu hỏi (Passage)"
    : "+ Thêm Câu hỏi mới";
  addBtn.onclick = () =>
    ["6", "7"].includes(partNum)
      ? addPassageBlock(partNum)
      : addQuestionBlock(partNum);
  area.appendChild(addBtn);
}

function addQuestionBlock(partNum) {
  const wrapper = document.getElementById("questionsWrapper");
  const qDiv = document.createElement("div");
  qDiv.className = "question-block";

  const hasImage = ["1", "3", "4"].includes(partNum);
  const optionsCount = partNum === "2" ? 3 : 4;
  const optionsArr = ["A", "B", "C", "D"].slice(0, optionsCount);

  let mediaHtml = "";
  if (hasImage) {
    mediaHtml = `
      <div class="q-media-zone">
        <div class="q-media-item">
          <label style="font-weight:bold; font-size:14px; color:#757575; display:block; margin-bottom:10px;">Hình ảnh đính kèm</label>
          <div class="file-upload-box" style="padding: 30px;">
            <input type="file" accept="image/*">
            <span>Tải ảnh lên (Tùy chọn)</span>
          </div>
        </div>
      </div>
    `;
  }

  let optionsHtml = `<div class="options-grid">`;
  optionsArr.forEach((opt) => {
    optionsHtml += `
      <div class="option-row">
        <input type="radio" name="correct_q${currentQuestionNum}" value="${opt}">
        <span>${opt}.</span>
        <input type="text" placeholder="Nhập nội dung đáp án ${opt}...">
      </div>
    `;
  });
  optionsHtml += `</div>`;

  qDiv.innerHTML = `
    <button class="q-delete-btn" onclick="this.parentElement.remove()" title="Xóa câu hỏi">🗑️</button>
    <div class="q-header">
      <div class="q-number">${currentQuestionNum}</div>
      <input type="text" class="q-text-input" placeholder="Nhập nội dung câu hỏi (Hoặc để trống nếu là Listening Part 1,2)...">
    </div>
    ${mediaHtml}
    ${optionsHtml}
  `;

  wrapper.appendChild(qDiv);
  currentQuestionNum++;
}

function addPassageBlock(partNum) {
  const wrapper = document.getElementById("questionsWrapper");
  const pDiv = document.createElement("div");
  pDiv.className = "question-block";
  pDiv.style.border = "2px solid #E0E0E0";
  pDiv.style.background = "white";

  pDiv.innerHTML = `
    <button class="q-delete-btn" onclick="this.parentElement.remove()" title="Xóa đoạn văn">🗑️</button>
    <h4 style="margin-top:0;">Đoạn văn / Bài đọc</h4>
    <div class="q-media-zone">
        <div class="q-media-item">
          <label style="font-weight:bold; font-size:14px; color:#757575; display:block; margin-bottom:10px;">Hình ảnh bài đọc (Tùy chọn)</label>
          <div class="file-upload-box">
            <input type="file" accept="image/*">
            <span>Tải ảnh lên</span>
          </div>
        </div>
    </div>
    <textarea class="passage-textarea" placeholder="Nhập nội dung đoạn văn (Text)..."></textarea>
    <div class="passage-questions" style="padding-left: 20px; border-left: 3px solid var(--primary-color);">
       <h4 style="color:var(--primary-hover); margin-bottom: 15px;">Các câu hỏi thuộc đoạn văn này:</h4>
       <div class="inner-q-wrapper"></div>
       <button class="btn-add-question" style="padding:10px; font-size:14px;" onclick="addInnerQuestion(this, ${partNum})">+ Thêm câu hỏi con</button>
    </div>
  `;
  wrapper.appendChild(pDiv);

  const innerWrapper = pDiv.querySelector(".inner-q-wrapper");
  innerWrapper.appendChild(createInnerQuestionHTML(partNum));
  currentQuestionNum++;
}

window.addInnerQuestion = function (btnElement, partNum) {
  const innerWrapper = btnElement.previousElementSibling;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = createInnerQuestionHTML(partNum);
  innerWrapper.appendChild(tempDiv.firstElementChild);
  currentQuestionNum++;
};

function createInnerQuestionHTML(partNum) {
  let optionsHtml = `<div class="options-grid" style="margin-top:10px;">`;
  ["A", "B", "C", "D"].forEach((opt) => {
    optionsHtml += `
      <div class="option-row">
        <input type="radio" name="correct_q${currentQuestionNum}" value="${opt}">
        <span>${opt}.</span>
        <input type="text" placeholder="Nhập nội dung đáp án ${opt}...">
      </div>
    `;
  });
  optionsHtml += `</div>`;

  return `
    <div class="question-block" style="background:#FAFAFA; box-shadow:none;">
        <button class="q-delete-btn" style="top:10px; right:10px; width:30px; height:30px;" onclick="this.parentElement.remove()">🗑️</button>
        <div class="q-header" style="margin-bottom:10px;">
          <div class="q-number" style="width:35px; height:35px; font-size:16px;">${currentQuestionNum}</div>
          <input type="text" class="q-text-input" placeholder="Nhập nội dung câu hỏi...">
        </div>
        ${optionsHtml}
    </div>
  `;
}
