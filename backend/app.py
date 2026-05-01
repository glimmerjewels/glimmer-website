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

@app.route('/products')
def get_products():
    return jsonify(products)

if __name__ == '__main__':
    app.run(debug=True)
