from flask import Blueprint, request, jsonify
from .services import generate_react_code

main = Blueprint('main', __name__)

@main.route('/generate_react', methods=['POST'])
def generate_react():
    data = request.json['data']
    response = generate_react_code(data)
    return jsonify({"generated_code": response})
