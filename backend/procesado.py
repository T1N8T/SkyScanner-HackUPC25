def procesar_resultados(data):
    itinerarios = data["content"]["results"]["itineraries"]
    legs = data["content"]["results"]["legs"]
    places = data["content"]["results"]["places"]
    carriers = data["content"]["results"]["carriers"]

    resultados = []
    for itinerary_id, itinerary in itinerarios.items():
        leg_id = itinerary["legIds"][0]
        leg = legs[leg_id]
        origin_id = leg["originPlaceId"]
        destination_id = leg["destinationPlaceId"]
        carrier_id = leg["carriers"][0]
        price = itinerary["pricingOptions"][0]["price"]["amount"]
        currency = itinerary["pricingOptions"][0]["price"]["unit"]

        resultado = {
            "origen": places[origin_id]["name"],
            "destino": places[destination_id]["name"],
            "aerolinea": carriers[carrier_id]["name"],
            "precio": f"{price} {currency}",
            "duracion": leg["durationInMinutes"],
            "salida": leg["departureDateTime"],
            "llegada": leg["arrivalDateTime"]
        }
        resultados.append(resultado)
    return resultados