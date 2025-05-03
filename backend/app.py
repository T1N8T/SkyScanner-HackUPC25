#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from skyscanner_api import crear_busqueda, obtener_resultados
from gemini_api import obtener_recomendacion_gemini
from datetime import datetime
from tratadodatoscl import extraer_datos_clientes
from procesado import *

app = Flask(__name__)
CORS(app)


@app.route("/api/submit-survey", methods=["POST"])
def submit_survey():
    datos = request.json
    trip_id = datos.get("trip_id")
    ruta_json = os.path.join("db", "survey_responses.json")
    if os.path.exists(ruta_json):
        with open(ruta_json, "r", encoding="utf-8") as f:
            respuestas = json.load(f)
    else:
        respuestas = []

    grupo = next((g for g in respuestas if g.get("trip_id") == trip_id), None)
    if grupo:
        grupo["respuestas"].append(datos)
    else:
        # Si no hay trip_id o no existe, crea uno nuevo (para uso individual)
        from datetime import datetime
        trip_id = trip_id or f"trip_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        respuestas.append({
            "trip_id": trip_id,
            "num_miembros": 1,
            "respuestas": [datos]
        })


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

@app.route("/api/procesar", methods=["POST"])
def procesar():
    datos = request.json
    trip_id = datos.get("trip_id")
    ruta_json = os.path.join("db", "survey_responses.json")
    with open(ruta_json, "r", encoding="utf-8") as f:
        respuestas = json.load(f)
    grupo = next((g for g in respuestas if g.get("trip_id") == trip_id), None)
    if not grupo:
        return jsonify({"status": "error", "message": "Grupo no encontrado"}), 404
    num_miembros = int(grupo.get("num_miembros", 1))
    if len(grupo["respuestas"]) < num_miembros:
        return jsonify({"status": "wait", "message": f"Faltan respuestas ({len(grupo['respuestas'])}/{num_miembros})"})
    try:
        descartar_paises(trip_id)
        return jsonify({"status": "success"})
    except Exception as e:
        print("Error detectado:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/crear-grupo", methods=["POST"])
def crear_grupo():
    datos = request.json
    num_miembros = datos.get("num_miembros")
    trip_id = f"trip_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    ruta_json = os.path.join("db", "survey_responses.json")
    if os.path.exists(ruta_json):
        with open(ruta_json, "r", encoding="utf-8") as f:
            respuestas = json.load(f)
    else:
        respuestas = []
    respuestas.append({
        "trip_id": trip_id,
        "num_miembros": num_miembros,
        "respuestas": []
    })
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(respuestas, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "success", "trip_id": trip_id})

if __name__ == "__main__":
    app.run(debug=True)