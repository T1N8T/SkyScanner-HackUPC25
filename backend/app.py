#SERVIDOR FLASK
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend (React)

@app.route('/api/submit-survey', methods=['POST'])
def submit_survey():
    data = request.json  # Recibe los datos enviados desde el frontend
    # Aquí puedes procesar las respuestas, por ejemplo:
    # resultado = procesar_respuestas(data)
    print("Respuestas recibidas:", data)
    # Retorna una respuesta al frontend
    return jsonify({"message": "Respuestas recibidas correctamente", "data": data}), 200

if __name__ == '__main__':
    app.run(debug=True)