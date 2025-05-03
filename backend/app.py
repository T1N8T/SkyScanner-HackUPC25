#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from skyscanner_api import crear_busqueda, obtener_resultados
from gemini_api import obtener_recomendacion_gemini
from datetime import datetime
# from procesado import procesar_resultados

app = Flask(__name__)
CORS(app)

@app.route("/api/submit-survey", methods=["POST"])
def submit_survey():
    datos = request.json

    # Cargar las respuestas existentes
    ruta_json = os.path.join("db", "survey_responses.json")
    if os.path.exists(ruta_json):
        with open(ruta_json, "r", encoding="utf-8") as f:
            respuestas = json.load(f)
    else:
        respuestas = []

    # Puedes generar un trip_id único, por ejemplo usando la fecha y hora
    trip_id = f"trip_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

    # Añadir la nueva respuesta
    respuestas.append({
        "trip_id": trip_id,
        "respuestas": [datos]
    })

    # Guardar el JSON actualizado
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(respuestas, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success", "message": "Formulario recibido", "trip_id": trip_id})

@app.route("/buscar_vuelo", methods=["POST"])
def buscar_vuelo():
    datos = request.json
    origen = datos.get("origen")
    destino = datos.get("destino")
    año = datos.get("año")
    mes = datos.get("mes")
    dia = datos.get("día")
    try:
        print("Llamando a crear_busqueda...")
        session_token = crear_busqueda(origen, destino, año, mes, dia)
        print("Session token:", session_token)
        data = obtener_resultados(session_token)
        print("Datos obtenidos de la API.")
        with open("db/respuesta_skyscanner.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("JSON guardado correctamente.")
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        print("Error detectado:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/recomendacion", methods=["POST"])
def recomendacion():
    datos = request.json
    trip_id = datos.get("trip_id")
    try:
        respuesta = obtener_recomendacion_gemini(trip_id)
        return jsonify({"status": "success", "recomendacion": respuesta})
    except Exception as e:
        print("Error detectado:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)