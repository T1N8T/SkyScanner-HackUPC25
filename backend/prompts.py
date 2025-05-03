#PROMPT PARA LA API DE GOOGLEdf
# Este es el prompt que se le envía a la API de Google para obtener información sobre un tema específico.
import json
import pandas as pd

def obtener_prompt_recomendacion(trip_id):
    # Cargar los candidatos
    with open("db/trip_candidates.json", "r", encoding="utf-8") as f:
        trip_candidates = json.load(f)
    candidato = next((c for c in trip_candidates if c["trip_id"] == trip_id), None)
    if not candidato:
        return {
            "prompt": "No se encontraron aeropuertos para este viaje."
        }

    iatas = candidato["iatas"]

    # Solo mostrar los códigos IATA en la lista de destinos
    destinos_str = ", ".join(iatas)

    # Cargar preferencias e idiomas de los usuarios
    with open("db/survey_responses.json", "r", encoding="utf-8") as f:
        survey_data = json.load(f)
    viaje = next((v for v in survey_data if v["trip_id"] == trip_id), None)
    if not viaje:
        preferencias_str = "No hay preferencias de los usuarios."
        idiomas_str = "No hay información de idiomas."
    else:
        preferencias = []
        idiomas = []
        for r in viaje["respuestas"]:
            if r.get("preferencia"):
                preferencias.append(f"{r.get('nombre', 'Usuario')}: {r['preferencia']}")
            if r.get("idiomas"):
                idiomas.append(f"{r.get('nombre', 'Usuario')}: {r['idiomas']}")
        preferencias_str = "\n".join(preferencias) if preferencias else "No hay preferencias de los usuarios."
        idiomas_str = "\n".join(idiomas) if idiomas else "No hay información de idiomas."

    prompt = (
    "Actúa como un experto en viajes y turismo. Tu tarea es recomendar exactamente tres destinos, "
    "elegidos únicamente de entre los siguientes aeropuertos preseleccionados (códigos IATA):\n"
    f"{destinos_str}\n\n"
    "Basándote en las siguientes preferencias agregadas de los usuarios:\n"
    f"{preferencias_str}\n\n"
    "Y en los idiomas que hablan los usuarios:\n"
    f"{idiomas_str}\n\n"
    "Selecciona los tres destinos que mejor se ajusten al conjunto de intereses y preferencias del grupo. "
    "Justifica brevemente tu elección en un tono objetivo y profesional. "
    "Utiliza el nombre de la ciudad (no el aeropuerto ni el código IATA) en la respuesta. Sé claro y conciso."
)


    return {
        "prompt": prompt
    }

