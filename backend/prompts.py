#PROMPT PARA LA API DE GOOGLE
# Este es el prompt que se le envía a la API de Google para obtener información sobre un tema específico.
import json
import pandas as pd

def obtener_prompt_recomendacion(trip_id):
    # Cargar los candidatos
    with open("db/trip_candidates.json", "r", encoding="utf-8") as f:
        trip_candidates = json.load(f)
    candidato = next((c for c in trip_candidates if c["trip_id"] == trip_id), None)
    if not candidato:
        return {"prompt": "No se encontraron aeropuertos para este viaje."}

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
        "Eres un experto en viajes y turismo. Tu tarea es recomendar un destino de viaje basado en las preferencias de un grupo de usuarios.\n"
        "Hemos preseleccionado varios aeropuertos según las respuestas de los usuarios. "
        "Elige tres destinos recomendados de entre esta lista, teniendo en cuenta los intereses y preferencias del usuario.\n"
        "Lista de destinos (códigos IATA): "
        f"{destinos_str}\n"
        "Preferencias de los usuarios:\n"
        f"{preferencias_str}\n"
        "Idiomas de los usuarios:\n"
        f"{idiomas_str}\n"
        "Asegúrate de incluir información sobre la cultura, actividades y cualquier otro aspecto relevante que pueda interesar al usuario y una explicación de por qué han sido seleccionados. "
        "En la respuesta utiliza el nombre de la ciudad, nunca el nombre del aeropuerto ni el código IATA."
    )

    return {
        "prompt": prompt,
        "temperature": 0.7,
        "max_tokens": 150,
        "top_p": 1.0,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0
    }