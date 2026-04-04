from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import BoTu, FlashCard
flashcard_bp = Blueprint('Flashcard', __name__)

# deck
@flashcard_bp.route('/decks', methods=['GET'])
@jwt_required()
def get_decks():
    try:
        current_user_id = int(get_jwt_identity())

        decks = BoTu.query.filter_by(MaNguoiDung=current_user_id).order_by(BoTu.NgayTao.desc()).all()

        result = []
        for deck in decks:
            result.append({
                "id": deck.MaBoTu,
                "title": deck.TenBoTu,
                "description": deck.MoTa,
                "icon": deck.Icon,
                "created_at": deck.NgayTao,
                "card_count": len(deck.flashcards)

            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "message": "Không thể lấy danh sách bộ từ",
            "error": str(e)
        }), 500

#Create deck
@flashcard_bp.route('/decks',methods=['POST'])
@jwt_required()
def create_deck():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon', '🌱')
    if not title:
        return jsonify({"message": "Tên bộ từ không được để trống"}), 400
    new_deck = BoTu(
        TenBoTu = title,
        MoTa = description,
        Icon = icon,
        MaNguoiDung = current_user_id
    )
    try:
        db.session.add(new_deck)
        db.session.commit()
        return jsonify({
            "message": "Tạo bộ từ thành công",
            "deck":{
                "id": new_deck.MaBoTu,
                "title": new_deck.TenBoTu,
                "description": new_deck.MoTa,
                "icon": new_deck.Icon,
                "card_count": 0
            }

        }),201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

#Detail_Deck
@flashcard_bp.route('/decks/<int:deck_id>',methods=['GET'])
@jwt_required()
def get_deck_detail(deck_id):
    try:
        current_user_id = int(get_jwt_identity())
        deck = BoTu.query.filter_by(MaBoTu=deck_id,MaNguoiDung=current_user_id).first()
        if not deck:
            return jsonify({"message":"Không tìm thấy bộ từ"}),404
        cards_data = FlashCard.query.filter_by(MaBoTu=deck_id).all()
        cards = []
        for card in cards_data:
            cards.append({
                "id": card.FlashCardId,
                "front": card.Tu,
                "back": card.Nghia,
                "phonetic": card.PhienAm,
                "example": card.ViDu
            })
        return jsonify({
            "id": deck.MaBoTu,
            "title": deck.TenBoTu,
            "description": deck.MoTa,
            "icon": deck.Icon,
            "cards": cards
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Không thể lấy chi tiết bộ từ",
            "error": str(e)
        }), 500

#Edit deck
@flashcard_bp.route('/decks/<int:deck_id>', methods=['PUT'])
@jwt_required()
def update_deck(deck_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    deck = BoTu.query.filter_by(MaBoTu=deck_id, MaNguoiDung=current_user_id).first()

    if not deck:
        return jsonify({"message": "Không tìm thấy bộ từ"}), 404

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon', '🌱')
    if not title:
        return jsonify({"message": "Tên bộ từ không được để trống"}), 400

    deck.TenBoTu = title
    deck.MoTa = description
    deck.Icon = icon
    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật bộ từ thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

#delete deck
@flashcard_bp.route('/decks/<int:deck_id>', methods=['DELETE'])
@jwt_required()
def delete_deck(deck_id):
    current_user_id = int(get_jwt_identity())
    deck = BoTu.query.filter_by(MaBoTu=deck_id, MaNguoiDung=current_user_id).first()

    if not deck:
        return jsonify({"message": "Không tìm thấy bộ từ"}), 404
    try:
        db.session.delete(deck)
        db.session.commit()
        return jsonify({"message": "Xóa bộ từ thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500


#Create_card
@flashcard_bp.route('/decks/<int:deck_id>/cards', methods=['POST'])
@jwt_required()
def create_card(deck_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    deck = BoTu.query.filter_by(MaBoTu=deck_id, MaNguoiDung=current_user_id).first()
    if not deck:
        return jsonify({"message": "Không tìm thấy bộ từ"}), 404

    front = data.get('front', '').strip()
    back = data.get('back', '').strip()
    phonetic = data.get('phonetic', '').strip()
    example = data.get('example', '').strip()

    if not front or not back:
        return jsonify({"message": "Mặt trước và mặt sau không được để trống"}), 400

    new_card = FlashCard(
        Tu=front,
        Nghia=back,
        PhienAm=phonetic,
        ViDu=example,
        MaBoTu=deck_id
    )

    try:
        db.session.add(new_card)
        db.session.commit()

        return jsonify({
            "message": "Thêm thẻ thành công",
            "card": {
                "id": new_card.FlashCardId,
                "front": new_card.Tu,
                "back": new_card.Nghia,
                "phonetic": new_card.PhienAm,
                "example": new_card.ViDu
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

#Edit card
@flashcard_bp.route('/cards/<int:card_id>', methods=['PUT'])
@jwt_required()
def update_card(card_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    card = FlashCard.query.get(card_id)
    if not card:
        return jsonify({"message": "Không tìm thấy thẻ"}), 404

    deck = BoTu.query.filter_by(MaBoTu=card.MaBoTu, MaNguoiDung=current_user_id).first()
    if not deck:
        return jsonify({"message": "Bạn không có quyền sửa thẻ này"}), 403

    front = data.get('front', '').strip()
    back = data.get('back', '').strip()
    phonetic = data.get('phonetic', '').strip()
    example = data.get('example', '').strip()

    if not front or not back:
        return jsonify({"message": "Mặt trước và mặt sau không được để trống"}), 400

    card.Tu = front
    card.Nghia = back
    card.PhienAm = phonetic
    card.ViDu = example

    try:
        db.session.commit()
        return jsonify({"message": "Cập nhật thẻ thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

#delete card
@flashcard_bp.route('/cards/<int:card_id>', methods=['DELETE'])
@jwt_required()
def delete_card(card_id):
    current_user_id = int(get_jwt_identity())

    card = FlashCard.query.get(card_id)
    if not card:
        return jsonify({"message": "Không tìm thấy thẻ"}), 404

    deck = BoTu.query.filter_by(MaBoTu=card.MaBoTu, MaNguoiDung=current_user_id).first()
    if not deck:
        return jsonify({"message": "Bạn không có quyền xóa thẻ này"}), 403

    try:
        db.session.delete(card)
        db.session.commit()
        return jsonify({"message": "Xóa thẻ thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500