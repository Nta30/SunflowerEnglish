from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from app import db
from app.models import (
    NguoiDung, DeThi, CauHoi, DapAn,
    NhomCauHoi, AnhNhomCauHoi, PhienLamBai,
    BoTu, FlashCard
)
from sqlalchemy import func, desc
from datetime import datetime
import os
import cloudinary
import cloudinary.uploader

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

admin_bp = Blueprint('admin', __name__)
bcrypt = Bcrypt()


def check_admin(user_id):
    user = NguoiDung.query.get(int(user_id))
    return user and user.VaiTro == 1


# ══════════════════════════════════════════
#  DASHBOARD STATS
# ══════════════════════════════════════════

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    total_users = NguoiDung.query.filter_by(VaiTro=0).count()
    total_sessions = PhienLamBai.query.filter(PhienLamBai.TrangThaiNop == True).count()

    avg_q = db.session.query(func.avg(PhienLamBai.DiemSo)) \
        .filter(PhienLamBai.TrangThaiNop == True).scalar()
    avg_score = round(avg_q) if avg_q else 0

    total_flashcards = FlashCard.query.count()
    total_exams = DeThi.query.count()

    # Recent activities (last 10 submissions)
    recent_raw = db.session.query(PhienLamBai, NguoiDung, DeThi) \
        .join(NguoiDung, PhienLamBai.MaNguoiDung == NguoiDung.MaNguoiDung) \
        .join(DeThi, PhienLamBai.MaDeThi == DeThi.MaDeThi) \
        .filter(PhienLamBai.TrangThaiNop == True) \
        .order_by(PhienLamBai.ThoiGianKetThuc.desc()) \
        .limit(10).all()

    recent_activities = []
    for phien, user, exam in recent_raw:
        recent_activities.append({
            "user": user.HoTen or user.TenTaiKhoan,
            "action": f"Hoàn thành \"{exam.TenDeThi}\" — {phien.DiemSo} điểm",
            "time": phien.ThoiGianKetThuc.strftime("%d/%m %H:%M") if phien.ThoiGianKetThuc else ""
        })

    # Top 5 popular exams
    top_raw = db.session.query(
        DeThi.TenDeThi,
        func.count(PhienLamBai.MaPhien).label('cnt')
    ).join(PhienLamBai, DeThi.MaDeThi == PhienLamBai.MaDeThi) \
     .filter(PhienLamBai.TrangThaiNop == True) \
     .group_by(DeThi.TenDeThi) \
     .order_by(desc('cnt')) \
     .limit(5).all()

    top_exams = [{"name": name, "count": cnt} for name, cnt in top_raw]

    return jsonify({
        "total_users": total_users,
        "total_sessions": total_sessions,
        "avg_score": avg_score,
        "total_flashcards": total_flashcards,
        "total_exams": total_exams,
        "recent_activities": recent_activities,
        "top_exams": top_exams
    }), 200


# ══════════════════════════════════════════
#  USER MANAGEMENT
# ══════════════════════════════════════════

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    users = NguoiDung.query.filter_by(VaiTro=0).order_by(NguoiDung.NgayTao.desc()).all()
    result = []
    for u in users:
        result.append({
            "id": u.MaNguoiDung,
            "username": u.TenTaiKhoan,
            "fullname": u.HoTen,
            "email": u.Email,
            "status": u.TrangThai,
            "created_at": u.NgayTao.strftime("%d/%m/%Y") if u.NgayTao else ""
        })
    return jsonify(result), 200


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    fullname = data.get('fullname', '').strip()
    email = data.get('email', '').strip()

    if not username or not password:
        return jsonify({"message": "Tên tài khoản và mật khẩu là bắt buộc"}), 400

    if NguoiDung.query.filter_by(TenTaiKhoan=username).first():
        return jsonify({"message": "Tên tài khoản đã tồn tại"}), 400

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = NguoiDung(
        TenTaiKhoan=username,
        MatKhau=hashed,
        HoTen=fullname or 'Học viên mới',
        Email=email,
        VaiTro=0,
        TrangThai=1
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Tạo học viên thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    user = NguoiDung.query.get(user_id)
    if not user or user.VaiTro == 1:
        return jsonify({"message": "Không tìm thấy người dùng"}), 404

    data = request.get_json()
    if 'fullname' in data:
        user.HoTen = data['fullname'].strip()
    if 'email' in data:
        user.Email = data['email'].strip()
    if 'password' in data and data['password']:
        user.MatKhau = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    user = NguoiDung.query.get(user_id)
    if not user or user.VaiTro == 1:
        return jsonify({"message": "Không tìm thấy người dùng"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Xoá người dùng thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_user_status(user_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    user = NguoiDung.query.get(user_id)
    if not user or user.VaiTro == 1:
        return jsonify({"message": "Không tìm thấy người dùng"}), 404

    user.TrangThai = 0 if user.TrangThai == 1 else 1
    status_text = "Hoạt động" if user.TrangThai == 1 else "Bị khoá"

    try:
        db.session.commit()
        return jsonify({"message": f"Đã chuyển trạng thái: {status_text}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


# ══════════════════════════════════════════
#  EXAM MANAGEMENT
# ══════════════════════════════════════════

@admin_bp.route('/exams', methods=['GET'])
@jwt_required()
def get_all_exams():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    exams = DeThi.query.order_by(DeThi.NgayTao.desc()).all()
    result = []
    for e in exams:
        q_count = CauHoi.query.filter_by(MaDeThi=e.MaDeThi).count()
        s_count = PhienLamBai.query.filter_by(MaDeThi=e.MaDeThi, TrangThaiNop=True).count()
        result.append({
            "id": e.MaDeThi,
            "name": e.TenDeThi,
            "description": e.MoTa,
            "duration": e.ThoiGianLam,
            "status": e.TrangThai,
            "question_count": q_count,
            "session_count": s_count,
            "created_at": e.NgayTao.strftime("%d/%m/%Y") if e.NgayTao else ""
        })
    return jsonify(result), 200


@admin_bp.route('/exams', methods=['POST'])
@jwt_required()
def create_exam():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    duration = data.get('duration', 120)

    if not name:
        return jsonify({"message": "Tên đề thi là bắt buộc"}), 400

    new_exam = DeThi(
        TenDeThi=name,
        MoTa=description,
        ThoiGianLam=int(duration),
        TrangThai=0  # Draft by default
    )

    try:
        db.session.add(new_exam)
        db.session.commit()
        return jsonify({
            "message": "Tạo đề thi thành công",
            "exam": {
                "id": new_exam.MaDeThi,
                "name": new_exam.TenDeThi
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/exams/<int:exam_id>', methods=['PUT'])
@jwt_required()
def update_exam(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    exam = DeThi.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Không tìm thấy đề thi"}), 404

    data = request.get_json()
    if 'name' in data:
        exam.TenDeThi = data['name'].strip()
    if 'description' in data:
        exam.MoTa = data['description'].strip()
    if 'duration' in data:
        exam.ThoiGianLam = int(data['duration'])

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật đề thi thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
@jwt_required()
def delete_exam(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    exam = DeThi.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Không tìm thấy đề thi"}), 404

    try:
        db.session.delete(exam)
        db.session.commit()
        return jsonify({"message": "Xoá đề thi thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/exams/<int:exam_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_exam_status(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    exam = DeThi.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Không tìm thấy đề thi"}), 404

    exam.TrangThai = 0 if exam.TrangThai == 1 else 1
    status_text = "Công khai" if exam.TrangThai == 1 else "Bản nháp"

    try:
        db.session.commit()
        return jsonify({"message": f"Đã chuyển: {status_text}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


# ══════════════════════════════════════════
#  QUESTION MANAGEMENT
# ══════════════════════════════════════════

@admin_bp.route('/exams/<int:exam_id>/questions', methods=['GET'])
@jwt_required()
def get_exam_questions(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    questions = CauHoi.query.filter_by(MaDeThi=exam_id).order_by(CauHoi.STT).all()
    result = []
    for q in questions:
        answers = DapAn.query.filter_by(MaCauHoi=q.MaCauHoi).all()
        nhom_data = None
        if q.MaNhom:
            nhom = NhomCauHoi.query.get(q.MaNhom)
            if nhom:
                images = AnhNhomCauHoi.query.filter_by(MaNhom=nhom.MaNhom) \
                    .order_by(AnhNhomCauHoi.ThuTu).all()
                nhom_data = {
                    "id": nhom.MaNhom,
                    "audio_url": nhom.AudioURL,
                    "images": [{"url": img.ImgURL, "order": img.ThuTu} for img in images]
                }

        result.append({
            "id": q.MaCauHoi,
            "stt": q.STT,
            "content": q.NoiDung,
            "explanation": q.GiaiThich,
            "audio_url": q.AudioURL,
            "image_url": q.ImgURL,
            "part": q.TenPart,
            "group_id": q.MaNhom,
            "group": nhom_data,
            "answers": [
                {
                    "id": a.MaDapAn,
                    "label": a.KyHieu,
                    "content": a.NoiDung,
                    "is_correct": a.IsCorrect
                }
                for a in answers
            ]
        })
    return jsonify(result), 200


@admin_bp.route('/exams/<int:exam_id>/questions', methods=['POST'])
@jwt_required()
def create_question(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    exam = DeThi.query.get(exam_id)
    if not exam:
        return jsonify({"message": "Không tìm thấy đề thi"}), 404

    data = request.get_json()
    stt = data.get('stt', 1)
    content = data.get('content', '').strip()
    explanation = data.get('explanation', '').strip()
    audio_url = data.get('audio_url', '').strip()
    image_url = data.get('image_url', '').strip()
    part = data.get('part', 1)
    group_id = data.get('group_id')
    answers_data = data.get('answers', [])

    # Create group if provided
    if data.get('new_group'):
        grp = data['new_group']
        new_group = NhomCauHoi(AudioURL=grp.get('audio_url', ''))
        db.session.add(new_group)
        db.session.flush()
        group_id = new_group.MaNhom

        # Add group images
        for idx, img_url in enumerate(grp.get('images', [])):
            if img_url.strip():
                db.session.add(AnhNhomCauHoi(
                    MaNhom=new_group.MaNhom,
                    ImgURL=img_url.strip(),
                    ThuTu=idx + 1
                ))

    new_q = CauHoi(
        STT=int(stt),
        NoiDung=content,
        GiaiThich=explanation,
        AudioURL=audio_url or None,
        ImgURL=image_url or None,
        TenPart=int(part),
        MaDeThi=exam_id,
        MaNhom=group_id
    )
    db.session.add(new_q)
    db.session.flush()

    # Create answers
    for ans in answers_data:
        db.session.add(DapAn(
            KyHieu=ans.get('label', ''),
            NoiDung=ans.get('content', ''),
            IsCorrect=ans.get('is_correct', False),
            MaCauHoi=new_q.MaCauHoi
        ))

    try:
        db.session.commit()
        return jsonify({
            "message": "Thêm câu hỏi thành công",
            "question_id": new_q.MaCauHoi
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_question(question_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    q = CauHoi.query.get(question_id)
    if not q:
        return jsonify({"message": "Không tìm thấy câu hỏi"}), 404

    data = request.get_json()
    if 'stt' in data:
        q.STT = int(data['stt'])
    if 'content' in data:
        q.NoiDung = data['content'].strip()
    if 'explanation' in data:
        q.GiaiThich = data['explanation'].strip()
    if 'audio_url' in data:
        q.AudioURL = data['audio_url'].strip() or None
    if 'image_url' in data:
        q.ImgURL = data['image_url'].strip() or None
    if 'part' in data:
        q.TenPart = int(data['part'])
    if 'group_id' in data:
        q.MaNhom = data['group_id']

    # Update answers
    if 'answers' in data:
        DapAn.query.filter_by(MaCauHoi=question_id).delete()
        for ans in data['answers']:
            db.session.add(DapAn(
                KyHieu=ans.get('label', ''),
                NoiDung=ans.get('content', ''),
                IsCorrect=ans.get('is_correct', False),
                MaCauHoi=question_id
            ))

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật câu hỏi thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


@admin_bp.route('/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    q = CauHoi.query.get(question_id)
    if not q:
        return jsonify({"message": "Không tìm thấy câu hỏi"}), 404

    try:
        db.session.delete(q)
        db.session.commit()
        return jsonify({"message": "Xoá câu hỏi thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500


# ══════════════════════════════════════════
#  QUESTION GROUPS
# ══════════════════════════════════════════

@admin_bp.route('/exams/<int:exam_id>/groups', methods=['GET'])
@jwt_required()
def get_exam_groups(exam_id):
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    # Get all unique group IDs for this exam
    group_ids = db.session.query(CauHoi.MaNhom).filter(
        CauHoi.MaDeThi == exam_id,
        CauHoi.MaNhom.isnot(None)
    ).distinct().all()

    result = []
    for (gid,) in group_ids:
        grp = NhomCauHoi.query.get(gid)
        if grp:
            images = AnhNhomCauHoi.query.filter_by(MaNhom=gid).order_by(AnhNhomCauHoi.ThuTu).all()
            q_count = CauHoi.query.filter_by(MaNhom=gid, MaDeThi=exam_id).count()
            result.append({
                "id": grp.MaNhom,
                "audio_url": grp.AudioURL,
                "images": [img.ImgURL for img in images],
                "question_count": q_count
            })

    return jsonify(result), 200


# ══════════════════════════════════════════
#  FLASHCARD STATS (Read-only)
# ══════════════════════════════════════════

@admin_bp.route('/flashcard-stats', methods=['GET'])
@jwt_required()
def get_flashcard_stats():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    total_decks = BoTu.query.count()
    total_cards = FlashCard.query.count()

    # Top users by deck count
    top_users = db.session.query(
        NguoiDung.HoTen,
        NguoiDung.TenTaiKhoan,
        func.count(BoTu.MaBoTu).label('deck_count')
    ).join(BoTu, NguoiDung.MaNguoiDung == BoTu.MaNguoiDung) \
     .group_by(NguoiDung.MaNguoiDung, NguoiDung.HoTen, NguoiDung.TenTaiKhoan) \
     .order_by(desc('deck_count')) \
     .limit(10).all()

    # All decks with user info
    decks_raw = db.session.query(BoTu, NguoiDung) \
        .join(NguoiDung, BoTu.MaNguoiDung == NguoiDung.MaNguoiDung) \
        .order_by(BoTu.NgayTao.desc()).all()

    decks = []
    for deck, user in decks_raw:
        card_count = FlashCard.query.filter_by(MaBoTu=deck.MaBoTu).count()
        decks.append({
            "id": deck.MaBoTu,
            "title": deck.TenBoTu,
            "description": deck.MoTa,
            "icon": deck.Icon,
            "card_count": card_count,
            "user": user.HoTen or user.TenTaiKhoan,
            "created_at": deck.NgayTao.strftime("%d/%m/%Y") if deck.NgayTao else ""
        })

    return jsonify({
        "total_decks": total_decks,
        "total_cards": total_cards,
        "top_users": [
            {"name": u[0] or u[1], "deck_count": u[2]}
            for u in top_users
        ],
        "decks": decks
    }), 200


# ══════════════════════════════════════════
#  FILE UPLOAD (Cloudinary)
# ══════════════════════════════════════════

@admin_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    if 'file' not in request.files:
        return jsonify({"message": "Không có file nào được gửi"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "File trống"}), 400

    upload_type = request.form.get('type', 'image')  # 'image' or 'audio'

    try:
        if upload_type == 'audio':
            result = cloudinary.uploader.upload(
                file,
                resource_type='video',
                folder='Sunflower_App/Audio'
            )
        else:
            result = cloudinary.uploader.upload(
                file,
                resource_type='image',
                folder='Sunflower_App/Image'
            )

        return jsonify({
            "message": "Upload thành công",
            "url": result['secure_url'],
            "public_id": result['public_id']
        }), 200

    except Exception as e:
        return jsonify({"message": f"Lỗi upload: {str(e)}"}), 500


# ══════════════════════════════════════════
#  GROUP CREATION (with file uploads)
# ══════════════════════════════════════════

@admin_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    uid = get_jwt_identity()
    if not check_admin(uid):
        return jsonify({"message": "Forbidden"}), 403

    audio_url = request.form.get('audio_url', '')
    image_urls_str = request.form.get('image_urls', '')

    # Upload audio if provided
    if 'audio_file' in request.files and request.files['audio_file'].filename:
        audio_file = request.files['audio_file']
        try:
            audio_result = cloudinary.uploader.upload(
                audio_file,
                resource_type='video',
                folder='Sunflower_App/Audio'
            )
            audio_url = audio_result['secure_url']
        except Exception as e:
            return jsonify({"message": f"Lỗi upload audio: {str(e)}"}), 500

    new_group = NhomCauHoi(AudioURL=audio_url or None)
    db.session.add(new_group)
    db.session.flush()

    # Upload images if provided
    image_files = request.files.getlist('image_files')
    for idx, img_file in enumerate(image_files):
        if img_file and img_file.filename:
            try:
                img_result = cloudinary.uploader.upload(
                    img_file,
                    resource_type='image',
                    folder='Sunflower_App/Image'
                )
                db.session.add(AnhNhomCauHoi(
                    MaNhom=new_group.MaNhom,
                    ImgURL=img_result['secure_url'],
                    ThuTu=idx + 1
                ))
            except Exception as e:
                db.session.rollback()
                return jsonify({"message": f"Lỗi upload ảnh: {str(e)}"}), 500

    # Also handle image URLs passed as string (comma separated)
    if image_urls_str:
        existing_count = AnhNhomCauHoi.query.filter_by(MaNhom=new_group.MaNhom).count()
        for idx, url in enumerate(image_urls_str.split(',')):
            url = url.strip()
            if url:
                db.session.add(AnhNhomCauHoi(
                    MaNhom=new_group.MaNhom,
                    ImgURL=url,
                    ThuTu=existing_count + idx + 1
                ))

    try:
        db.session.commit()

        images = AnhNhomCauHoi.query.filter_by(MaNhom=new_group.MaNhom) \
            .order_by(AnhNhomCauHoi.ThuTu).all()

        return jsonify({
            "message": "Tạo nhóm câu hỏi thành công",
            "group": {
                "id": new_group.MaNhom,
                "audio_url": new_group.AudioURL,
                "images": [img.ImgURL for img in images],
                "question_count": 0
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi: {str(e)}"}), 500