from . import db
from datetime import datetime

# 1. Bảng Người dùng
class NguoiDung(db.Model):
    __tablename__ = 'NguoiDung'
    MaNguoiDung = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenTaiKhoan = db.Column(db.String(50), nullable=False)
    MatKhau = db.Column(db.String(255), nullable=False)
    HoTen = db.Column(db.NVARCHAR(100))
    Email = db.Column(db.String(100))
    VaiTro = db.Column(db.SmallInteger) # 0: User, 1: Admin
    TrangThai = db.Column(db.SmallInteger) # 0: Khoá, 1: Hoạt động
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)
    MucTieu = db.Column(db.Integer)
    NgayThi = db.Column(db.DateTime)

    # Quan hệ
    phien_lam_bai = db.relationship('PhienLamBai', backref='user', lazy=True)
    bo_tu = db.relationship('BoTu', backref='user', lazy=True)

# 2. Bảng Đề thi
class DeThi(db.Model):
    __tablename__ = 'DeThi'
    MaDeThi = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenDeThi = db.Column(db.NVARCHAR(200), nullable=False)
    MoTa = db.Column(db.NVARCHAR(None)) # NVARCHAR(MAX)
    ThoiGianLam = db.Column(db.Integer) # Phút
    TrangThai = db.Column(db.SmallInteger)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Quan hệ
    cau_hoi = db.relationship('CauHoi', backref='dethi', cascade="all, delete-orphan")
    phien_lam_bai = db.relationship('PhienLamBai', backref='dethi', cascade="all, delete-orphan")

# 3. Bảng Nhóm câu hỏi
class NhomCauHoi(db.Model):
    __tablename__ = 'NhomCauHoi'
    MaNhom = db.Column(db.Integer, primary_key=True, autoincrement=True)
    AudioURL = db.Column(db.String(500))

    # Quan hệ
    anh_nhom = db.relationship('AnhNhomCauHoi', backref='nhom', cascade="all, delete-orphan")
    cau_hoi = db.relationship('CauHoi', backref='nhom', cascade="all, delete-orphan")

# 3.1. Bảng Ảnh nhóm câu hỏi
class AnhNhomCauHoi(db.Model):
    __tablename__ = 'AnhNhomCauHoi'
    MaAnh = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNhom = db.Column(db.Integer, db.ForeignKey('NhomCauHoi.MaNhom', ondelete='CASCADE'), nullable=False)
    ImgURL = db.Column(db.String(500), nullable=False)
    ThuTu = db.Column(db.Integer, default=1)

# 4. Bảng Câu hỏi
class CauHoi(db.Model):
    __tablename__ = 'CauHoi'
    MaCauHoi = db.Column(db.Integer, primary_key=True, autoincrement=True)
    STT = db.Column(db.Integer)
    NoiDung = db.Column(db.NVARCHAR(None))
    GiaiThich = db.Column(db.NVARCHAR(None))
    MaNhom = db.Column(db.Integer, db.ForeignKey('NhomCauHoi.MaNhom', ondelete='CASCADE'), nullable=True)
    AudioURL = db.Column(db.String(500))
    ImgURL = db.Column(db.String(500))
    TenPart = db.Column(db.Integer)
    MaDeThi = db.Column(db.Integer, db.ForeignKey('DeThi.MaDeThi'), nullable=True)

    # Quan hệ
    dap_an = db.relationship('DapAn', backref='cauhoi', cascade="all, delete-orphan")

# 5. Bảng Đáp án
class DapAn(db.Model):
    __tablename__ = 'DapAn'
    MaDapAn = db.Column(db.Integer, primary_key=True, autoincrement=True)
    NoiDung = db.Column(db.NVARCHAR(None))
    KyHieu = db.Column(db.String(1)) # A, B, C, D
    IsCorrect = db.Column(db.Boolean, default=False)
    MaCauHoi = db.Column(db.Integer, db.ForeignKey('CauHoi.MaCauHoi', ondelete='CASCADE'))

# 6. Bảng Phiên làm bài
class PhienLamBai(db.Model):
    __tablename__ = 'PhienLamBai'
    MaPhien = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNguoiDung = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'))
    MaDeThi = db.Column(db.Integer, db.ForeignKey('DeThi.MaDeThi'))
    ThoiGianBatDau = db.Column(db.DateTime, default=datetime.utcnow)
    ThoiGianKetThuc = db.Column(db.DateTime)
    SoCauDung = db.Column(db.Integer)
    SoCauSai = db.Column(db.Integer)
    SoCauKhongChon = db.Column(db.Integer)
    DiemSo = db.Column(db.Integer)
    TrangThaiNop = db.Column(db.Boolean, default=False)

    # Quan hệ
    chi_tiet_phien = db.relationship('ChiTietPhienLam', backref='phienlambai', cascade="all, delete-orphan")

# 7. Bảng Chi tiết phiên làm bài
class ChiTietPhienLam(db.Model):
    __tablename__ = 'ChiTietPhienLam'
    MaPhien = db.Column(db.Integer, db.ForeignKey('PhienLamBai.MaPhien'), primary_key=True)
    MaCauHoi = db.Column(db.Integer, db.ForeignKey('CauHoi.MaCauHoi'), primary_key=True)
    MaDapAnChon = db.Column(db.Integer, db.ForeignKey('DapAn.MaDapAn'))

# 8. Bảng Bộ từ
class BoTu(db.Model):
    __tablename__ = 'BoTu'
    MaBoTu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenBoTu = db.Column(db.NVARCHAR(100), nullable=False)
    MoTa = db.Column(db.NVARCHAR(None))
    Icon = db.Column(db.NVARCHAR(10), default='🌱')
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)
    MaNguoiDung = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'))

    # Quan hệ
    flashcards = db.relationship('FlashCard', backref='botu', cascade="all, delete-orphan")

# 9. Bảng Từ (Từ điển chung)
class Tu(db.Model):
    __tablename__ = 'Tu'
    MaTu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenTu = db.Column('Tu', db.NVARCHAR(100), nullable=False)
    PhienAm = db.Column(db.NVARCHAR(100))
    AudioUrl = db.Column(db.String(500))

    # Quan hệ
    loai_tu = db.relationship('TuLoai', backref='tu', cascade="all, delete-orphan")

# 10. Bảng FlashCard
class FlashCard(db.Model):
    __tablename__ = 'FlashCard'
    FlashCardId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Tu = db.Column(db.NVARCHAR(100))
    Nghia = db.Column(db.NVARCHAR(None))
    PhienAm = db.Column(db.NVARCHAR(100))
    ViDu = db.Column(db.NVARCHAR(None))
    MaBoTu = db.Column(db.Integer, db.ForeignKey('BoTu.MaBoTu', ondelete='CASCADE'))

# 11. Bảng Loại từ
class TuLoai(db.Model):
    __tablename__ = 'TuLoai'
    MaTuLoai = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Loai = db.Column(db.NVARCHAR(50)) # n, v, adj, adv
    MaTu = db.Column(db.Integer, db.ForeignKey('Tu.MaTu', ondelete='CASCADE'))

    # Quan hệ
    chi_tiet = db.relationship('ChiTietTu', backref='tuloai', cascade="all, delete-orphan")

# 12. Bảng Chi tiết từ
class ChiTietTu(db.Model):
    __tablename__ = 'ChiTietTu'
    MaChiTietTu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Nghia = db.Column(db.NVARCHAR(None))
    ViDu = db.Column(db.NVARCHAR(None))
    TuDongNghia = db.Column(db.NVARCHAR(None))
    TuTraiNghia = db.Column(db.NVARCHAR(None))
    MaTuLoai = db.Column(db.Integer, db.ForeignKey('TuLoai.MaTuLoai', ondelete='CASCADE'))