#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend (React)

DATA_FILE = os.path.join("db", "survey_responses.json")

def save_response(data):
    # Crea la carpeta si no existe
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    # Carga respuestas previas si existen
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            responses = json.load(f)
    else:
        responses = []
    # Añade la nueva respuesta
    responses.append(data)
    # Guarda la lista actualizada
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(responses, f, ensure_ascii=False, indent=2)

@app.route('/api/submit-survey', methods=['POST'])
def submit_survey():
    data = request.json  # Recibe los datos enviados desde el frontend
    save_response(data)
    print("Respuestas recibidas:", data)
    # Retorna una respuesta al frontend
    return jsonify({"message": "Respuestas recibidas correctamente", "data": data}), 200

if __name__ == '__main__':
    app.run(debug=True)