#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from skyscanner_api import crear_busqueda, obtener_resultados
from gemini_api import obtener_recomendacion_gemini
from datetime import datetime
from tratadodatoscl import extraer_datos_clientes, media_ponderada_presupuesto
# from procesado import procesar_resultados
from procesado import descartar_paises

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

def buscar_vuelos_presupuesto(trip_id):
    presupuesto = media_ponderada_presupuesto(trip_id)
    if presupuesto == 0:
        return []
    # Orígenes de los clientes (con fechaInicio)
    clientes = extraer_datos_clientes()
    orígenes_fechas = [
        (c["iata"], c["fechaInicio"])
        for c in clientes if c["iata"] and c["fechaInicio"]
    ]

    # Destinos filtrados
    with open("db/trip_candidates.json", "r", encoding="utf-8") as f:
        trip_candidates = json.load(f)
    candidato = next((c for c in trip_candidates if c["trip_id"] == trip_id), None)
    if not candidato:
        return []
    destinos = candidato["iatas"]

    resultados = []
    destinos_con_vuelo = set()
    for origen, fecha in orígenes_fechas:
        try:
            año, mes, dia = map(int, fecha.split("-"))
        except Exception:
            continue  # Si la fecha no es válida, saltar
        for destino in destinos:
            try:
                session_token = crear_busqueda(origen, destino, año, mes, dia)
                data = obtener_resultados(session_token)
                itineraries = data["content"]["results"]["itineraries"]
                for it_id, it in itineraries.items():
                    for option in it.get("pricingOptions", []):
                        price = option.get("price", {}).get("amount", float("inf"))
                        if price <= presupuesto:
                            resultados.append({
                                "origen": origen,
                                "destino": destino,
                                "precio": price,
                                "itineraryId": it_id
                            })
                            destinos_con_vuelo.add(destino)
            except Exception as e:
                print(f"Error buscando vuelo {origen}->{destino}: {e}")

    # Actualizar trip_candidates.json con los destinos que tienen vuelo dentro del presupuesto
    for c in trip_candidates:
        if c["trip_id"] == trip_id:
            c["iatas"] = list(destinos_con_vuelo)
    with open("db/trip_candidates.json", "w", encoding="utf-8") as f:
        json.dump(trip_candidates, f, ensure_ascii=False, indent=2)

    return resultados

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