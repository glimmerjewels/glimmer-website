from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

products = [
    {
        "name": "Charm Bracelet",
        "price": 699,
        "image": "assets/images/bracelet.jpg"
    },
    {
        "name": "Floral Necklace",
        "price": 799,
        "image": "assets/images/necklace.jpg"
    }
]

@app.route('/')
def home():
    return "Glimmer Backend Running ✨"

@app.route('/products')
def get_products():
    return jsonify([
        {"name": "Bracelet", "price": 699, "image": "https://yourimageurl.com"}
    ])

if __name__ == '__main__':
    app.run(debug=True)
