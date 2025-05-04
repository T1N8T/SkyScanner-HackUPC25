import os
import requests
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener la API Key desde las variables de entorno
api_key = os.getenv("SKYSCANNER_API_KEY")
BASE_URL = "https://partners.api.skyscanner.net/apiservices"

def crear_busqueda(origen, destino, año, mes, dia):
    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    data = {
        "query": {
            "market": "ES",
            "locale": "es-ES",
            "currency": "EUR",
            "queryLegs": [
                {
                    "originPlaceId": { "iata": str(origen) },
                    "destinationPlaceId": { "iata": str(destino) },
                    "date": {
                        "year": int(año),
                        "month": int(mes),
                        "day": int(dia)
                    }
                }
            ],
            "cabinClass": "CABIN_CLASS_ECONOMY",
            "adults": 1
        }
    }
    response = requests.post(url, headers=headers, json=data)
    # print("Status code:", response.status_code)
    # print("Respuesta texto:", response.text)
    if response.status_code == 200:
        session_token = response.json()["sessionToken"]
        return session_token
    else:
        # Imprime el contenido para depuración
        raise Exception(f"Error en crear_busqueda: {response.status_code} - {response.text}")

def obtener_resultados(session_token):
    url = f"https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{session_token}"
    headers = {
        "x-api-key": api_key
    }
    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error en obtener_resultados: {response.status_code} - {response.text}")