from flask import Blueprint, request, jsonify
from app import db
from app.models import Tu, TuLoai, ChiTietTu
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import json

dictionary_bp = Blueprint('dictionary', __name__)

def fetch_synonyms_antonyms(word):
    """
    Lấy từ đồng nghĩa và trái nghĩa từ Datamuse API
    """
    try:
        # Lấy từ đồng nghĩa
        synonyms_url = f"https://api.datamuse.com/words?rel_syn={word}&max=10"
        synonyms_response = requests.get(synonyms_url, timeout=10)
        synonyms = []
        if synonyms_response.status_code == 200:
            synonyms_data = synonyms_response.json()
            synonyms = [item['word'] for item in synonyms_data[:5]]  # Lấy 5 từ
        
        # Lấy từ trái nghĩa
        antonyms_url = f"https://api.datamuse.com/words?rel_ant={word}&max=10"
        antonyms_response = requests.get(antonyms_url, timeout=10)
        antonyms = []
        if antonyms_response.status_code == 200:
            antonyms_data = antonyms_response.json()
            antonyms = [item['word'] for item in antonyms_data[:5]]  # Lấy 5 từ
        
        return {
            'synonyms': synonyms,
            'antonyms': antonyms
        }
    except Exception as e:
        print(f"Error fetching synonyms/antonyms: {str(e)}")
        return {'synonyms': [], 'antonyms': []}

def fetch_from_free_dictionary(word):
    """
    Gọi Free Dictionary API để lấy thông tin từ
    """
    try:
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0]
        return None
    except Exception as e:
        print(f"Error fetching from dictionary API: {str(e)}")
        return None

def save_word_to_db(word_data):
    """
    Lưu từ vựng từ Free Dictionary API vào database (có từ đồng nghĩa/trái nghĩa)
    """
    try:
        word = word_data.get('word', '')
        if not word:
            return None
        
        # Kiểm tra từ đã tồn tại chưa
        existing_word = Tu.query.filter_by(TenTu=word).first()
        if existing_word:
            return existing_word
        
        # Lấy từ đồng nghĩa/trái nghĩa
        syn_ant_data = fetch_synonyms_antonyms(word)
        
        # Tạo từ mới
        new_word = Tu(
            TenTu=word,
            PhienAm=word_data.get('phonetic', '')
        )
        
        # Lấy audio URL nếu có
        phonetics = word_data.get('phonetics', [])
        for phonetic in phonetics:
            if phonetic.get('audio'):
                new_word.AudioUrl = phonetic.get('audio')
                break
        
        db.session.add(new_word)
        db.session.flush()
        
        # Xử lý các nghĩa (meanings)
        meanings = word_data.get('meanings', [])
        for meaning in meanings:
            part_of_speech = meaning.get('partOfSpeech', '')
            
            # Tạo TuLoai
            tu_loai = TuLoai(
                Loai=part_of_speech,
                MaTu=new_word.MaTu
            )
            db.session.add(tu_loai)
            db.session.flush()
            
            # Xử lý các định nghĩa (definitions)
            definitions = meaning.get('definitions', [])
            for definition in definitions:
                chi_tiet_tu = ChiTietTu(
                    Nghia=definition.get('definition', ''),
                    ViDu=definition.get('example', '') if definition.get('example') else None,
                    TuDongNghia=','.join(syn_ant_data['synonyms']) if syn_ant_data['synonyms'] else None,
                    TuTraiNghia=','.join(syn_ant_data['antonyms']) if syn_ant_data['antonyms'] else None,
                    MaTuLoai=tu_loai.MaTuLoai
                )
                db.session.add(chi_tiet_tu)
        
        db.session.commit()
        return new_word
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving word: {str(e)}")
        return None

def format_word_response(word_obj):
    """
    Format dữ liệu từ database thành response (có từ đồng nghĩa/trái nghĩa)
    """
    result = {
        'word': word_obj.TenTu,
        'phonetic': word_obj.PhienAm,
        'audio': word_obj.AudioUrl,
        'meanings': []
    }
    
    # Lấy các loại từ
    for tu_loai in word_obj.loai_tu:
        meaning = {
            'partOfSpeech': tu_loai.Loai,
            'definitions': []
        }
        
        # Lấy chi tiết từng loại từ
        for chi_tiet in tu_loai.chi_tiet:
            definition = {
                'definition': chi_tiet.Nghia,
                'example': chi_tiet.ViDu,
                'synonyms': chi_tiet.TuDongNghia.split(',') if chi_tiet.TuDongNghia else [],
                'antonyms': chi_tiet.TuTraiNghia.split(',') if chi_tiet.TuTraiNghia else []
            }
            meaning['definitions'].append(definition)
        
        result['meanings'].append(meaning)
    
    return result

def format_api_response(api_data):
    """
    Format dữ liệu từ Free Dictionary API thành response đồng nhất
    """
    result = {
        'word': api_data.get('word', ''),
        'phonetic': api_data.get('phonetic', ''),
        'audio': '',
        'meanings': []
    }
    
    # Lấy audio từ phonetics
    phonetics = api_data.get('phonetics', [])
    for phonetic in phonetics:
        if phonetic.get('audio'):
            result['audio'] = phonetic.get('audio')
            break
    
    # Xử lý meanings
    meanings = api_data.get('meanings', [])
    for meaning in meanings:
        formatted_meaning = {
            'partOfSpeech': meaning.get('partOfSpeech', ''),
            'definitions': []
        }
        
        definitions = meaning.get('definitions', [])
        for definition in definitions:
            formatted_definition = {
                'definition': definition.get('definition', ''),
                'example': definition.get('example', '') if definition.get('example') else None
            }
            formatted_meaning['definitions'].append(formatted_definition)
        
        result['meanings'].append(formatted_meaning)
    
    return result

# API: Lấy từ đồng nghĩa/trái nghĩa
@dictionary_bp.route('/synonyms/<string:word>', methods=['GET'])
def get_synonyms_antonyms(word):
    """
    Lấy từ đồng nghĩa và trái nghĩa của một từ
    GET /api/dictionary/synonyms/<word>
    """
    try:
        data = fetch_synonyms_antonyms(word)
        return jsonify({
            "status": "success",
            "word": word,
            "synonyms": data['synonyms'],
            "antonyms": data['antonyms']
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Tra cứu từ vựng
@dictionary_bp.route('/lookup/<string:word>', methods=['GET'])
def lookup_word(word):
    """
    API tra cứu từ vựng
    GET /api/dictionary/lookup/<word>
    """
    try:
        # Kiểm tra từ có trong database không
        word_obj = Tu.query.filter_by(TenTu=word).first()
        
        if word_obj:
            # Có trong database, lấy từ database
            result = format_word_response(word_obj)
            return jsonify({
                "status": "success",
                "source": "database",
                "data": result
            }), 200
        
        # Không có trong database, gọi API Free Dictionary
        api_data = fetch_from_free_dictionary(word)
        
        if not api_data:
            return jsonify({
                "status": "error",
                "message": f"Không tìm thấy từ \"{word}\" trong từ điển"
            }), 404
        
        # Lưu vào database
        saved_word = save_word_to_db(api_data)
        
        # Format response
        result = format_api_response(api_data)
        
        return jsonify({
            "status": "success",
            "source": "api",
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Tìm kiếm từ vựng
@dictionary_bp.route('/search', methods=['GET'])
def search_words():
    """
    Tìm kiếm từ vựng (gợi ý từ)
    GET /api/dictionary/search?q=<keyword>
    """
    try:
        keyword = request.args.get('q', '')
        if not keyword:
            return jsonify({
                "status": "error",
                "message": "Vui lòng nhập từ khóa tìm kiếm"
            }), 400
        
        # Tìm kiếm từ trong database
        words = Tu.query.filter(Tu.TenTu.like(f'%{keyword}%')).limit(20).all()
        
        result = []
        for word in words:
            result.append({
                'word': word.TenTu,
                'phonetic': word.PhienAm
            })
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Lấy chi tiết từ theo ID
@dictionary_bp.route('/<int:word_id>', methods=['GET'])
def get_word_by_id(word_id):
    """
    Lấy chi tiết từ vựng theo ID
    GET /api/dictionary/<word_id>
    """
    try:
        word_obj = Tu.query.get(word_id)
        
        if not word_obj:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy từ vựng"
            }), 404
        
        result = format_word_response(word_obj)
        
        return jsonify({
            "status": "success",
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500