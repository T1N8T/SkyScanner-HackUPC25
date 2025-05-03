import json
import os
from gemini_api import obtener_iatas_con_gemini

def extraer_datos_clientes(trip_id):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "db", "survey_responses.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    clientes = []
    viaje = next((v for v in data if v.get("trip_id") == trip_id), None)
    if not viaje:
        return []
    for respuesta in viaje["respuestas"]:
        origen = respuesta.get("origen", "")
        if not origen:
            continue
        iatas = obtener_iatas_con_gemini(origen)
        if not iatas:
            continue
        clientes.append({
            "nombre": respuesta.get("nombre", ""),
            "presupuestoImportancia": respuesta.get("presupuestoImportancia", 1),
            "presupuestomax": respuesta.get("presupuestomax", 0),
            "fechaInicio": respuesta.get("fechaInicio", ""),
            "iata": iatas  # Puede ser lista de IATAs
        })
    return clientes