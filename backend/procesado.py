import json
import pandas as pd

def descartar_paises(trip_id):
    with open("db/survey_responses.json", "r", encoding="utf-8") as f:
        viaje = json.load(f)
    
    pais_df = pd.read_csv("data/IATACountry.csv")
    mujer_df = pd.read_csv("data/womenindex.csv")
    internet_df = pd.read_csv("data/internetrank.csv")
    lgtb_df = pd.read_csv("data/lgbtindex.csv")
    skyscanner_df = pd.read_csv("data/skyscanner.csv")

    viaje = next((v for v in viaje if v["trip_id"] == trip_id), None)
    if viaje is None:
        return None
    
    respuestas = viaje["respuestas"]
    
    valores_r_mujer = {"si": 1, "no": 0, "indiferente": 0.5}
    valores = [valores_r_mujer.get(r.get("seguridadmuj", "indiferente"), 0.5) for r in respuestas]
    mv_mujer = sum(valores) / len(valores) if valores else 0

    if mv_mujer > 0.8:
        paises_filtrados = mujer_df[mujer_df["Index"] > 0.8]["Country"].tolist()
    elif mv_mujer > 0.6:
        paises_filtrados = mujer_df[mujer_df["Index"] > 0.65]["Country"].tolist()
    elif mv_mujer > 0.4:
        paises_filtrados = mujer_df[mujer_df["Index"] > 0.5]["Country"].tolist()
    else:
        paises_filtrados = mujer_df["Country"].tolist()  # No se filtra, se devuelven todos

    
