import json
import os
from gemini_api import obtener_iatas_con_gemini

def extraer_datos_clientes():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "db", "survey_responses.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    clientes = []
    for viaje in data:
        for respuesta in viaje["respuestas"]:
            origen = respuesta.get("origen")
            presupuestomax = respuesta.get("presupuestomax")
            fechaInicio = respuesta.get("fechaInicio")
            iata = obtener_iatas_con_gemini(origen)
            clientes.append({
                "presupuestomax": presupuestomax,
                "fechaInicio": fechaInicio,
                "iata": iata
            })
    return clientes