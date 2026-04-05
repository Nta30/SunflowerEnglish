from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import DeThi, CauHoi, DapAn, NhomCauHoi, AnhNhomCauHoi, PhienLamBai, ChiTietPhienLam
from app import db
from datetime import datetime, timedelta

exam_bp = Blueprint('exam', __name__)


@exam_bp.route('/', methods=['GET'])
@jwt_required()
def get_exams():
    exams = DeThi.query.filter_by(TrangThai=1).all()
    user_id = get_jwt_identity()
    result = []
    for e in exams:
        total_questions = CauHoi.query.filter_by(MaDeThi=e.MaDeThi).count()
        # Check if user has completed this exam
        session = PhienLamBai.query.filter_by(
            MaNguoiDung=user_id, MaDeThi=e.MaDeThi, TrangThaiNop=True
        ).first()
        status = 'done' if session else 'new'
        status_text = f'Đã xong: {session.DiemSo}' if session else 'Chưa làm'

        result.append({
            'MaDeThi': e.MaDeThi,
            'TenDeThi': e.TenDeThi,
            'MoTa': e.MoTa,
            'ThoiGianLam': e.ThoiGianLam,
            'SoCau': total_questions,
            'TrangThai': status,
            'TrangThaiText': status_text,
            'NgayTao': e.NgayTao.isoformat() if e.NgayTao else None
        })
    return jsonify(result)


@exam_bp.route('/<int:exam_id>', methods=['GET'])
@jwt_required()
def get_exam_detail(exam_id):
    exam = DeThi.query.get_or_404(exam_id)
    questions = CauHoi.query.filter_by(MaDeThi=exam_id).order_by(CauHoi.STT).all()

    q_list = []
    for q in questions:
        answers = DapAn.query.filter_by(MaCauHoi=q.MaCauHoi).all()

        nhom_data = None
        if q.MaNhom:
            nhom = NhomCauHoi.query.get(q.MaNhom)
            if nhom:
                images = AnhNhomCauHoi.query.filter_by(
                    MaNhom=nhom.MaNhom
                ).order_by(AnhNhomCauHoi.ThuTu).all()
                nhom_data = {
                    'MaNhom': nhom.MaNhom,
                    'AudioURL': nhom.AudioURL,
                    'images': [{'ImgURL': img.ImgURL, 'ThuTu': img.ThuTu} for img in images]
                }

        q_list.append({
            'MaCauHoi': q.MaCauHoi,
            'STT': q.STT,
            'NoiDung': q.NoiDung,
            'GiaiThich': q.GiaiThich,
            'AudioURL': q.AudioURL,
            'ImgURL': q.ImgURL,
            'TenPart': q.TenPart,
            'MaNhom': q.MaNhom,
            'nhom': nhom_data,
            'dap_an': [
                {'MaDapAn': a.MaDapAn, 'KyHieu': a.KyHieu, 'NoiDung': a.NoiDung}
                for a in answers
            ]
        })

    return jsonify({
        'MaDeThi': exam.MaDeThi,
        'TenDeThi': exam.TenDeThi,
        'MoTa': exam.MoTa,
        'ThoiGianLam': exam.ThoiGianLam,
        'questions': q_list
    })


@exam_bp.route('/<int:exam_id>/submit', methods=['POST'])
@jwt_required()
def submit_exam(exam_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    answers = data.get('answers', {})
    selected_parts = data.get('selectedParts', [])
    time_spent_seconds = data.get('timeSpent', 0)

    exam = DeThi.query.get_or_404(exam_id)
    questions = CauHoi.query.filter_by(MaDeThi=exam_id).all()

    if selected_parts and len(selected_parts) > 0:
        selected_parts = [int(p) for p in selected_parts]
        questions = [q for q in questions if q.TenPart in selected_parts]

    correct = 0
    wrong = 0
    unanswered = 0

    end_time = datetime.now()
    start_time = end_time - timedelta(seconds=time_spent_seconds)

    phien = PhienLamBai(
        MaNguoiDung=user_id,
        MaDeThi=exam_id,
        ThoiGianBatDau=start_time,
        ThoiGianKetThuc=end_time,
        TrangThaiNop=True
    )
    db.session.add(phien)
    db.session.flush()

    for q in questions:
        chosen_id = answers.get(str(q.MaCauHoi))
        if chosen_id:
            chosen_answer = DapAn.query.get(int(chosen_id))
            if chosen_answer and chosen_answer.IsCorrect:
                correct += 1
            else:
                wrong += 1

            detail = ChiTietPhienLam(
                MaPhien=phien.MaPhien,
                MaCauHoi=q.MaCauHoi,
                MaDapAnChon=int(chosen_id)
            )
            db.session.add(detail)
        else:
            unanswered += 1
            detail = ChiTietPhienLam(
                MaPhien=phien.MaPhien,
                MaCauHoi=q.MaCauHoi,
                MaDapAnChon=None
            )
            db.session.add(detail)

    phien.SoCauDung = correct
    phien.SoCauSai = wrong
    phien.SoCauKhongChon = unanswered

    # Tính điểm TOEIC mới mỗi câu 5đ
    lc_questions = [q for q in questions if q.TenPart in [1, 2, 3, 4]]
    rc_questions = [q for q in questions if q.TenPart in [5, 6, 7]]

    lc_correct = 0
    for q in lc_questions:
        cid = answers.get(str(q.MaCauHoi))
        if cid:
            a = DapAn.query.get(int(cid))
            if a and a.IsCorrect:
                lc_correct += 1

    rc_correct = 0
    for q in rc_questions:
        cid = answers.get(str(q.MaCauHoi))
        if cid:
            a = DapAn.query.get(int(cid))
            if a and a.IsCorrect:
                rc_correct += 1

    lc_score = lc_correct * 5
    rc_score = rc_correct * 5

    phien.DiemSo = lc_score + rc_score
    phien.DiemLC = lc_score
    phien.DiemRC = rc_score
    db.session.commit()

    return jsonify({
        'MaPhien': phien.MaPhien,
        'SoCauDung': correct,
        'SoCauSai': wrong,
        'SoCauKhongChon': unanswered,
        'DiemLC': lc_score,
        'DiemRC': rc_score,
        'TongDiem': lc_score + rc_score
    })


@exam_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    sessions = PhienLamBai.query.filter_by(
        MaNguoiDung=user_id, TrangThaiNop=True
    ).order_by(PhienLamBai.ThoiGianKetThuc.desc()).all()

    result = []
    for s in sessions:
        exam = DeThi.query.get(s.MaDeThi)
        result.append({
            'MaPhien': s.MaPhien,
            'TenDeThi': exam.TenDeThi if exam else 'N/A',
            'DiemSo': s.DiemSo,
            'DiemLC': s.DiemLC or 0,
            'DiemRC': s.DiemRC or 0,
            'SoCauDung': s.SoCauDung,
            'SoCauSai': s.SoCauSai,
            'SoCauKhongChon': s.SoCauKhongChon,
            'ThoiGianBatDau': s.ThoiGianBatDau.isoformat() if s.ThoiGianBatDau else None,
            'ThoiGianKetThuc': s.ThoiGianKetThuc.isoformat() if s.ThoiGianKetThuc else None
        })
    return jsonify(result)


@exam_bp.route('/history/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_detail(session_id):
    user_id = get_jwt_identity()
    phien = PhienLamBai.query.filter_by(
        MaPhien=session_id, MaNguoiDung=user_id
    ).first_or_404()

    exam = DeThi.query.get(phien.MaDeThi)
    details = ChiTietPhienLam.query.filter_by(MaPhien=session_id).all()
    answered_map = {d.MaCauHoi: d.MaDapAnChon for d in details}

    question_ids = [d.MaCauHoi for d in details]

    # Nếu có dữ liệu phiên, chỉ lấy đúng các câu hỏi đó. 
    # Fallback nếu lịch sử cũ (chưa fix) không có câu nào.
    if question_ids:
        questions = CauHoi.query.filter(CauHoi.MaCauHoi.in_(question_ids)).order_by(CauHoi.STT).all()
    else:
        questions = CauHoi.query.filter_by(MaDeThi=phien.MaDeThi).order_by(CauHoi.STT).all()

    result = []
    for q in questions:
        answers = DapAn.query.filter_by(MaCauHoi=q.MaCauHoi).all()
        chosen_id = answered_map.get(q.MaCauHoi)
        chosen = next((a for a in answers if a.MaDapAn == chosen_id), None)
        correct = next((a for a in answers if a.IsCorrect), None)

        nhom_data = None
        if q.MaNhom:
            nhom = NhomCauHoi.query.get(q.MaNhom)
            if nhom:
                images = AnhNhomCauHoi.query.filter_by(
                    MaNhom=nhom.MaNhom
                ).order_by(AnhNhomCauHoi.ThuTu).all()
                nhom_data = {
                    'MaNhom': nhom.MaNhom,
                    'AudioURL': nhom.AudioURL,
                    'images': [{'ImgURL': img.ImgURL, 'ThuTu': img.ThuTu} for img in images]
                }

        result.append({
            'MaCauHoi': q.MaCauHoi,
            'STT': q.STT,
            'NoiDung': q.NoiDung,
            'GiaiThich': q.GiaiThich,
            'AudioURL': q.AudioURL,
            'ImgURL': q.ImgURL,
            'TenPart': q.TenPart,
            'MaNhom': q.MaNhom,
            'nhom': nhom_data,
            'dap_an': [
                {
                    'MaDapAn': a.MaDapAn,
                    'KyHieu': a.KyHieu,
                    'NoiDung': a.NoiDung,
                    'IsCorrect': a.IsCorrect
                }
                for a in answers
            ],
            'DapAnChonId': chosen_id,
            'DapAnChonKyHieu': chosen.KyHieu if chosen else None,
            'IsCorrect': chosen.IsCorrect if chosen else False,
            'DapAnDungKyHieu': correct.KyHieu if correct else None,
            'DapAnDungId': correct.MaDapAn if correct else None,
        })

    return jsonify({
        'MaPhien': phien.MaPhien,
        'TenDeThi': exam.TenDeThi if exam else 'N/A',
        'DiemSo': phien.DiemSo,
        'SoCauDung': phien.SoCauDung,
        'SoCauSai': phien.SoCauSai,
        'SoCauKhongChon': phien.SoCauKhongChon,
        'ThoiGianBatDau': phien.ThoiGianBatDau.isoformat() if phien.ThoiGianBatDau else None,
        'ThoiGianKetThuc': phien.ThoiGianKetThuc.isoformat() if phien.ThoiGianKetThuc else None,
        'chi_tiet': result
    })
