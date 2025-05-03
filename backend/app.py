#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from skyscanner_api import crear_busqueda, obtener_resultados
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route("/api/submit-survey", methods=["POST"])
def submit_survey():
    datos = request.json
    #print("Datos del formulario recibidos:", datos)
    return jsonify({"status": "success", "message": "Formulario recibido"})

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

if __name__ == "__main__":
    app.run(debug=True)