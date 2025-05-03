#SERVIDOR FLASK
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from skyscanner_api import crear_busqueda, obtener_resultados
from datetime import datetime
from tratadodatoscl import extraer_datos_clientes, media_ponderada_presupuesto
# from procesado import procesar_resultados

app = Flask(__name__)
CORS(app)

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


if __name__ == "__main__":
    app.run(debug=True)