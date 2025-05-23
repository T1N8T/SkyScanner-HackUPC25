import json
import pandas as pd
import ast
from skyscanner_api import crear_busqueda, obtener_resultados
from tratadodatoscl import extraer_datos_clientes

def descartar_paises(trip_id):
    with open("db/survey_responses.json", "r", encoding="utf-8") as f:
        viajes = json.load(f)
    
    pais_df = pd.read_csv("data/IATACountry.csv")
    mujer_df = pd.read_csv("data/womenindex.csv")
    mujer_df["Index"] = pd.to_numeric(mujer_df["Index"], errors="coerce")

    internet_df = pd.read_csv("data/internetrank.csv")
    internet_df["Rank"] = pd.to_numeric(internet_df["Rank"], errors="coerce")

    lgtb_df = pd.read_csv("data/lgbtindex.csv")
    lgtb_df["Index"] = pd.to_numeric(lgtb_df["Index"], errors="coerce")

    skyscanner_df = pd.read_csv("data/skyscanner.csv")

    viaje = next((v for v in viajes if v.get("trip_id") == trip_id), None)
    if viaje is None:
        return None
    
    respuestas = viaje["respuestas"]

    # --- FILTRO MUJER ---
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
        paises_filtrados = mujer_df["Country"].tolist()

    # --- FILTRO LGTB ---
    valores_r_lgtb = {"si": 1, "no": 0, "indiferente": 0.5}
    valores_lgtb = [valores_r_lgtb.get(r.get("seguridadLGTB", "indiferente"), 0.5) for r in respuestas]
    mv_lgtb = sum(valores_lgtb) / len(valores_lgtb) if valores_lgtb else 0

    if mv_lgtb > 0.8:
        paises_lgtb = lgtb_df[lgtb_df["Index"] > 80]["Country"].tolist()
    elif mv_lgtb > 0.6:
        paises_lgtb = lgtb_df[lgtb_df["Index"] > 60]["Country"].tolist()
    elif mv_lgtb > 0.4:
        paises_lgtb = lgtb_df[lgtb_df["Index"] > 40]["Country"].tolist()
    else:
        paises_lgtb = lgtb_df["Country"].tolist()

    paises_filtrados = list(set(paises_filtrados) & set(paises_lgtb))

    # --- FILTRO INTERNET ---
    valores_r_internet = {"si": 1, "no": 0, "indiferente": 0.5}
    valores_internet = [valores_r_internet.get(r.get("internet", "indiferente"), 0.5) for r in respuestas]
    mv_internet = sum(valores_internet) / len(valores_internet) if valores_internet else 0

    if mv_internet > 0.8:
        paises_internet = internet_df[internet_df["Rank"] <= 75]["Country"].tolist()
    elif mv_internet > 0.6:
        paises_internet = internet_df[internet_df["Rank"] <= 125]["Country"].tolist()
    elif mv_internet > 0.4:
        paises_internet = internet_df[internet_df["Rank"] <= 150]["Country"].tolist()
    else:
        paises_internet = internet_df["Country"].tolist()

    paises_filtrados = list(set(paises_filtrados) & set(paises_internet))

    # --- OBTENER IATA DE LOS PAÍSES FILTRADOS ---
    iata_df = pd.read_csv("data/IATACountry.csv")
    iatas = iata_df[iata_df["Country"].isin(paises_filtrados)]["IATA"].tolist()

    # --- FILTRO INTERESES DINÁMICO ---
    intereses = {
        "playa": "beach",
        "nocturno": "nightlife_and_entertainment",
        "arte": "art_and_culture",
        "comida": "great_food",
        "aventuras": "outdoor_adventures"
    }
    total_respuestas = len(respuestas)

    for interes, columna in intereses.items():
        count = sum(
            interes in r.get("interes", []) if isinstance(r.get("interes", []), list) else r.get("interes", "") == interes
            for r in respuestas
        )
        ratio = count / total_respuestas if total_respuestas else 0

        if ratio > 0:  # Aplica el filtro si al menos un usuario lo selecciona
            def tiene_vibe(row):
                vibes = row.get("vibes") if isinstance(row, dict) else getattr(row, "vibes", None)
                if pd.isna(vibes) or vibes == "null":
                    return False
                try:
                    vibes_dict = ast.literal_eval(vibes.replace('""', '"'))
                    valor = vibes_dict.get(columna, "0")
                    return valor == "1"
                except Exception:
                    return False

            # Filtra skyscanner_df por los IATAs actuales y por el interés
            skyscanner_filtrado = skyscanner_df[skyscanner_df["IATA"].isin(iatas)]
            iatas_con_interes = skyscanner_filtrado[skyscanner_filtrado.apply(tiene_vibe, axis=1)]["IATA"].tolist()
            iatas = [iata for iata in iatas if iata in iatas_con_interes]

    # --- FILTRO IATAS VÁLIDOS ---
    iatas_validos = set(skyscanner_df["IATA"].dropna().unique())
    iatas = [iata for iata in iatas if iata in iatas_validos]

    # --- GUARDAR SOLO ID Y IATAS EN trip_candidates.json ---
    try:
        with open("db/trip_candidates.json", "r", encoding="utf-8") as f:
            trip_candidates = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        trip_candidates = []

    trip_candidates = [c for c in trip_candidates if c.get("trip_id") != trip_id]
    trip_candidates.append({
        "trip_id": trip_id,
        "iatas": iatas
    })

    with open("db/trip_candidates.json", "w", encoding="utf-8") as f:
        json.dump(trip_candidates, f, ensure_ascii=False, indent=2)

    return iatas

def buscar_vuelos_presupuesto(trip_id):
    # Cargar datos de clientes (personas del viaje)
    clientes = extraer_datos_clientes(trip_id)
    if not clientes:
        return []

    # Cargar destinos candidatos
    with open("db/trip_candidates.json", "r", encoding="utf-8") as f:
        trip_candidates = json.load(f)
    candidato = next((c for c in trip_candidates if c["trip_id"] == trip_id), None)
    if not candidato or not candidato["iatas"]:
        return []
    destinos = candidato["iatas"]

    resultados = []
    destinos_con_vuelo = set()

    for cliente in clientes:
        # Puede haber varios orígenes por persona (ej: ["LHR", "LGW"])
        origenes = cliente["iata"]
        if isinstance(origenes, str):
            origenes = [origenes]
        fecha = cliente.get("fechaInicio")
        try:
            presupuesto = float(cliente.get("presupuestomax", 0))
            importanciaPresupuesto = float(cliente.get("presupuestoImportancia", 0))
            presupuesto = presupuesto + presupuesto*1/(2*importanciaPresupuesto)
        except Exception:
            presupuesto = 0
        if not fecha or not origenes or presupuesto == 0:
            continue
        try:
            año, mes, dia = map(int, fecha.split("-"))
        except Exception:
            continue  # Fecha inválida

        for origen in origenes:
            for destino in destinos:
                print(f"Probando origen: {origen}, destino: {destino}")
                try:
                    session_token = crear_busqueda(origen, destino, año, mes, dia)
                    data = obtener_resultados(session_token)
                    itineraries = data["content"]["results"]["itineraries"]
                    for it_id, it in itineraries.items():
                        for option in it.get("pricingOptions", []):
                            price = option.get("price", {}).get("amount", float("inf"))
                            try:
                                price = float(price) / 1000  # O solo float(price) si ya está en euros
                            except Exception:
                                continue
                            if price <= presupuesto:
                                resultados.append({
                                    "origen": origen,
                                    "destino": destino,
                                    "precio": price,
                                    "itineraryId": it_id,
                                    "cliente": cliente.get("nombre", "")
                                })
                                destinos_con_vuelo.add(destino)
                except Exception as e:
                    print(f"Error buscando vuelo {origen}->{destino}: {e}")

    # Actualizar trip_candidates.json con los destinos que tienen vuelo dentro del presupuesto de al menos una persona
    for c in trip_candidates:
        if c["trip_id"] == trip_id:
            c["iatas"] = list(destinos_con_vuelo)
    with open("db/trip_candidates.json", "w", encoding="utf-8") as f:
        json.dump(trip_candidates, f, ensure_ascii=False, indent=2)

    return resultados