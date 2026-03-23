from app import create_app, db

app = create_app()

@app.route('/')
def home():
    return '<h1>Hello</h1>'

if __name__ == '__main__':
    with app.app_context():
        try:
            db.session.execute(db.text('SELECT 1'))
            print("🌻 Kết nối SQL Server thành công!")
        except Exception as e:
            print(f"❌ Lỗi kết nối Database: {e}")

    app.run(host='0.0.0.0', port=5000, debug=True)