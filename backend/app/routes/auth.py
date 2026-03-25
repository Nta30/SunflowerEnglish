from flask import Blueprint, request, jsonify
from app import db
from app.models import NguoiDung
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
import datetime

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

#Register
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if NguoiDung.query.filter_by(TenTaiKhoan=data.get('username')).first():
        return jsonify({"message": "Tên tài khoản đã tồn tại! 🌱"}), 400
    
    hashed_password = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
    
    new_user = NguoiDung(
        TenTaiKhoan=data.get('username'),
        MatKhau=hashed_password,
        HoTen=data.get('fullname', 'Học viên mới'),
        Email=data.get('email'),
        VaiTro=0,
        TrangThai=1
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Đăng ký thành công!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

#Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = NguoiDung.query.filter_by(TenTaiKhoan=username).first()
    
    if user and bcrypt.check_password_hash(user.MatKhau, password):
        expires = datetime.timedelta(days=1)
        access_token = create_access_token(identity=str(user.MaNguoiDung), expires_delta=expires)
        
        return jsonify({
            "message": "Đăng nhập thành công!",
            "access_token": access_token,
            "user": {
                "id": user.MaNguoiDung,
                "username": user.TenTaiKhoan,
                "fullname": user.HoTen,
                "role": user.VaiTro
            }
        }), 200
    
    return jsonify({"message": "Tài khoản hoặc mật khẩu không chính xác!"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = NguoiDung.query.get(current_user_id)
    return jsonify({
        "username": user.TenTaiKhoan,
        "fullname": user.HoTen,
        "email": user.Email
    }), 200