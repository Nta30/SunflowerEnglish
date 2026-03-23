document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra quyền Admin
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn || !isAdmin) {
    alert("⛔ Bạn không có quyền truy cập vào khu vực này!");
    window.location.href = "index.html"; // Đuổi về trang chủ
    return;
  }

  // ... (Các đoạn mã logic admin cũ của bạn giữ nguyên bên dưới)
});
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
  const headerTitle = document.querySelector(".admin-header h2");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      headerTitle.innerText =
        tab.innerText
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s/g, "")
          .replace(/^[^\w\sÀ-ỹ]+/g, "")
          .trim() || tab.innerText.substring(2).trim();
    });
  });

  const logoutBtn = document.getElementById("adminLogoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    window.location.href = "index.html";
  });

  const recentActivityTable = document.getElementById("recentActivityTable");
  mockActivities.forEach((act) => {
    recentActivityTable.innerHTML += `
            <tr>
                <td>${act.user}</td>
                <td>${act.action}</td>
                <td style="color: #A3AED0;">${act.time}</td>
            </tr>
        `;
  });

  const topExamsList = document.getElementById("topExamsList");
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

  const usersTableBody = document.getElementById("usersTableBody");
  mockUsers.forEach((user) => {
    usersTableBody.innerHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge status-${user.status}">${user.statusText}</span></td>
                <td>
                    <button class="action-btn edit" onclick="editItem('user', '${user.id}')">✏️</button>
                    <button class="action-btn delete" onclick="deleteItem('${user.id}')">🗑️</button>
                </td>
            </tr>
        `;
  });

  const examsTableBody = document.getElementById("examsTableBody");
  mockExams.forEach((exam) => {
    examsTableBody.innerHTML += `
            <tr>
                <td>${exam.id}</td>
                <td>${exam.name}</td>
                <td>${exam.questions}</td>
                <td>${exam.views}</td>
                <td><span class="status-badge status-${exam.status}">${exam.statusText}</span></td>
                <td>
                    <button class="action-btn edit" onclick="editItem('exam', '${exam.id}')">✏️</button>
                    <button class="action-btn delete" onclick="deleteItem('${exam.id}')">🗑️</button>
                </td>
            </tr>
        `;
  });

  const crudForm = document.getElementById("crudForm");
  crudForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Dữ liệu đã được lưu thành công vào cơ sở dữ liệu! 🌱");
    closeCrudModal();
  });
});

function openCrudModal(type) {
  const modal = document.getElementById("crudModal");
  const title = document.getElementById("crudModalTitle");
  const fields = document.getElementById("crudFormFields");

  fields.innerHTML = "";

  if (type === "user") {
    title.innerText = "Thêm Học viên mới";
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
  } else if (type === "exam") {
    title.innerText = "Tạo Đề thi mới";
    fields.innerHTML = `
            <div class="admin-input-group">
                <label>Tên đề thi</label>
                <input type="text" required placeholder="Ví dụ: ETS 2024 Test 2...">
            </div>
            <div class="admin-input-group">
                <label>Số lượng câu hỏi</label>
                <input type="number" required placeholder="Ví dụ: 200">
            </div>
            <div class="admin-input-group">
                <label>File Audio (Part 1-4)</label>
                <input type="file" accept="audio/*">
            </div>
            <div class="admin-input-group">
                <label>Trạng thái</label>
                <select>
                    <option value="draft">Bản nháp</option>
                    <option value="public">Công khai</option>
                </select>
            </div>
        `;
  }

  modal.classList.add("active");
}

function closeCrudModal() {
  document.getElementById("crudModal").classList.remove("active");
}

window.editItem = function (type, id) {
  openCrudModal(type);
  document.getElementById("crudModalTitle").innerText =
    "Cập nhật dữ liệu: " + id;
};

window.deleteItem = function (id) {
  if (
    confirm(
      `Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ${id} không? Hành động này không thể hoàn tác.`,
    )
  ) {
    alert("Đã xóa thành công!");
  }
};
