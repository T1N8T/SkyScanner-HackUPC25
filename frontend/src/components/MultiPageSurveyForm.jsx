import { useState } from "react";

export default function MultiPageSurveyForm() {
  const [form, setForm] = useState({
    nombre: "",
    interes: [], // Definido como un array
    presupuestomax: "",
    presupuestoImportancia: "",
    origen: "",
    seguridadLGTB: "",
    seguridadmuj: "",
    fechaInicio: "",
    internet: "",
    idiomas: "",
    preferencia: "",
  });
  const [currentPage, setCurrentPage] = useState(0); // Controla la página actual
  const [enviado, setEnviado] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [recomendacion, setRecomendacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [numMiembros, setNumMiembros] = useState(2);
  const [modo, setModo] = useState(null); // "crear" o "unir"
  const [inputTripId, setInputTripId] = useState("");
  const [interesError, setInteresError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      if (form.interes.length < 2) {
        setForm((prevForm) => ({
          ...prevForm,
          interes: [...prevForm.interes, value],
        }));
        setInteresError("");
      } else {
        setInteresError("Solo puedes seleccionar hasta 2 opciones.");
      }
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        interes: prevForm.interes.filter((item) => item !== value),
      }));
      setInteresError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/api/submit-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, trip_id: tripId }),
    });
  
    if (response.ok) {
      const data = await response.json();
      setTripId(data.trip_id); // <-- Añade esta línea
      setEnviado(true);
    } else {
      console.error("Error al enviar el formulario");
    }
  };

  const nextPage = () => setCurrentPage((prev) => prev + 1);
  const prevPage = () => setCurrentPage((prev) => prev - 1);

  const mostrarRecomendacion = async () => {
    setCargando(true);
    try {
      // Procesar datos
      const resp = await fetch("http://localhost:5000/api/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });
      const data = await resp.json();
      if (data.status === "wait") {
        setRecomendacion(data.message); // Muestra mensaje de espera
        setCargando(false);
        setMostrarResultados(true);
        return;
      }
      // Luego pedir la recomendación
      const response = await fetch("http://localhost:5000/api/recomendacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });
      const data2 = await response.json();
      setRecomendacion(data2.recomendacion);
    } catch (error) {
      setRecomendacion("Error al obtener la recomendación.");
    }
    setCargando(false);
    setMostrarResultados(true);
  };

  const crearGrupo = async () => {
    const resp = await fetch("http://localhost:5000/api/crear-grupo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ num_miembros: numMiembros }),
    });
    const data = await resp.json();
    setTripId(data.trip_id);
  };

  if (!modo) {
    return (
      <div>
        <h2>¿Qué quieres hacer?</h2>
        <button onClick={() => setModo("crear")}>Crear grupo nuevo</button>
        <button onClick={() => setModo("unir")}>Unirme a un grupo existente</button>
      </div>
    );
  }

  if (modo === "unir" && !tripId) {
    return (
      <div>
        <h2>Introduce el código de tu grupo</h2>
        <input
          type="text"
          value={inputTripId}
          onChange={e => setInputTripId(e.target.value)}
          placeholder="Código de grupo"
        />
        <button
          onClick={() => {
            setTripId(inputTripId.trim());
          }}
          disabled={!inputTripId.trim()}
        >
          Unirme
        </button>
        <button onClick={() => setModo(null)}>Volver</button>
      </div>
    );
  }

  if (modo === "crear" && !tripId) {
    return (
      <div>
        <h2>Crear grupo nuevo</h2>
        <label>
          Número de miembros:
          <input
            type="number"
            min={1}
            value={numMiembros}
            onChange={e => setNumMiembros(Number(e.target.value))}
          />
        </label>
        <br />
        <button
          onClick={async () => {
            const resp = await fetch("http://localhost:5000/api/crear-grupo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ num_miembros: numMiembros }),
            });
            const data = await resp.json();
            setTripId(data.trip_id);
          }}
        >
          Crear grupo
        </button>
        <button onClick={() => setModo(null)}>Volver</button>
      </div>
    );
  }

  if (enviado && !mostrarResultados) {
    return (
      <div>
        <p>¡Gracias por responder!</p>
        {tripId && (
          <p>
            Tu código de viaje es: <strong>{tripId}</strong>
          </p>
        )}
        <button onClick={mostrarRecomendacion}>
          Ver mi recomendación
        </button>
      </div>
    );
  }
  if (enviado && mostrarResultados) {
    // Procesar la recomendación de Gemini en 3 tarjetas
    let tarjetas = [];
    if (recomendacion) {
      // Divide el texto en 3 partes usando regex para separar por 1. 2. 3.
      const partes = recomendacion.split(/\n?\s*\d+\.\s+/).filter(Boolean);
      tarjetas = partes.slice(0, 3).map((texto, idx) => {
        // Extrae el nombre de la ciudad entre comillas al principio
        const match = texto.match(/^"([^"]+)"\.?\s*(.*)$/s);
        const ciudad = match ? match[1].trim() : `Destino ${idx + 1}`;
        const explicacion = match ? match[2].trim() : texto.trim();
        // Imagen de ejemplo (puedes cambiar la url por una real si tienes)
        const imagenes = [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80"
        ];
        return {
          destino: ciudad,
          explicacion,
          imagen: imagenes[idx % imagenes.length]
        };
      });
    }
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7fa", padding: "2rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: 32 }}>¡Tus destinos recomendados!</h2>
        {cargando && <p>Cargando recomendación...</p>}
        {!cargando && (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
            {tarjetas.length > 0 ? tarjetas.map((t, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 16px #ddd",
                width: 320,
                margin: "0 1rem 2rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 0
              }}>
                <a href="https://www.skyscanner.es/" target="_blank" rel="noopener noreferrer" style={{ width: "100%" }}>
                  <img src={t.imagen} alt={t.destino} style={{ width: "100%", height: 200, objectFit: "cover", borderTopLeftRadius: 16, borderTopRightRadius: 16, cursor: "pointer" }} />
                </a>
                <div style={{ padding: "1.2rem", width: "100%" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", textAlign: "center", color: "#2d2d2d" }}>{t.destino}</h3>
                  <p style={{ color: "#555", fontSize: 16, textAlign: "center" }}>{t.explicacion}</p>
                </div>
              </div>
            )) : <p>{recomendacion}</p>}
          </div>
        )}
        <div style={{ width: "100%", marginTop: 24, textAlign: "center" }}>
          <button onClick={() => window.location.reload()}>Volver a empezar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {currentPage === 0 && (
          <div>
            <label>
              Cuál es tu nombre?
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                required
              />
            </label>
            <br />
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.nombre.trim()}
            >
              Siguiente
            </button>
          </div>
        )}

        {currentPage === 1 && (
          <div>
            <label>¿Qué tipo de experiencias buscas principalmente en un viaje? (elige hasta 2)</label>
            <div>
              <div className="option-row">
                <input
                  type="checkbox"
                  name="interes"
                  value="nocturno"
                  checked={form.interes.includes("nocturno")}
                  onChange={handleCheckboxChange}
                  id="interes-nocturno"
                />
                <label htmlFor="interes-nocturno">Vida nocturna y entretenimiento</label>
              </div>
              <div className="option-row">
                <input
                  type="checkbox"
                  name="interes"
                  value="playa"
                  checked={form.interes.includes("playa")}
                  onChange={handleCheckboxChange}
                  id="interes-playa"
                />
                <label htmlFor="interes-playa">Playa</label>
              </div>
              <div className="option-row">
                <input
                  type="checkbox"
                  name="interes"
                  value="arte"
                  checked={form.interes.includes("arte")}
                  onChange={handleCheckboxChange}
                  id="interes-arte"
                />
                <label htmlFor="interes-arte">Arte y cultura</label>
              </div>
              <div className="option-row">
                <input
                  type="checkbox"
                  name="interes"
                  value="comida"
                  checked={form.interes.includes("comida")}
                  onChange={handleCheckboxChange}
                  id="interes-comida"
                />
                <label htmlFor="interes-comida">Buena comida</label>
              </div>
              <div className="option-row">
                <input
                  type="checkbox"
                  name="interes"
                  value="aventuras"
                  checked={form.interes.includes("aventuras")}
                  onChange={handleCheckboxChange}
                  id="interes-aventuras"
                />
                <label htmlFor="interes-aventuras">Aventuras al aire libre</label>
              </div>
            </div>
            {interesError && (
              <div style={{ color: '#ffb347', background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '0.5em', marginTop: '0.5em', fontWeight: 500 }}>
                {interesError}
              </div>
            )}
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={form.interes.length === 0}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 2 && (
          <div>
            <label>
              ¿Cómo de importante considera el presupuesto máximo? (1 = Nada importante, 5 = Muy importante):
              <input
                name="presupuestoImportancia"
                type="number"
                min="1"
                max="5"
                value={form.presupuestoImportancia}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (Number(value) >= 1 && Number(value) <= 5)) {
                    setForm({ ...form, presupuestoImportancia: value });
                  }
                }}
                required
              />
            </label>
            <br />
            <label>
              ¿Cuál es su presupuesto máximo? (en euros):
              <input
                name="presupuestomax"
                type="number"
                min="1"
                value={form.presupuestomax}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={
                !form.presupuestoImportancia ||
                !form.presupuestomax ||
                Number(form.presupuestoImportancia) < 1 ||
                Number(form.presupuestoImportancia) > 5 ||
                Number(form.presupuestomax) <= 0
              }
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 3 && (
          <div>
            <label>
              ¿Cuál es tu lugar de origen?:
              <input
                name="origen"
                value={form.origen}
                onChange={handleChange}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.origen.trim()}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 4 && (
          <div>
            <label>¿Te interesa que el destino sea especialmente seguro para mujeres? (elige una opción)</label>
            <div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="si"
                  checked={form.seguridadmuj === "si"}
                  onChange={handleChange}
                  id="seguridadmuj-si"
                />
                <label htmlFor="seguridadmuj-si">Sí, es una prioridad para mí.</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="indiferente"
                  checked={form.seguridadmuj === "indiferente"}
                  onChange={handleChange}
                  id="seguridadmuj-indiferente"
                />
                <label htmlFor="seguridadmuj-indiferente">Sí, pero no es un requisito excluyente.</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="no"
                  checked={form.seguridadmuj === "no"}
                  onChange={handleChange}
                  id="seguridadmuj-no"
                />
                <label htmlFor="seguridadmuj-no">No es algo que considere necesario.</label>
              </div>
            </div>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.seguridadmuj}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 5 && (
          <div>
            <label>¿Te interesa que el destino sea especialmente seguro para personas LGTB? (elige una opción)</label>
            <div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="si"
                  checked={form.seguridadLGTB === "si"}
                  onChange={handleChange}
                  id="seguridadLGTB-si"
                />
                <label htmlFor="seguridadLGTB-si">Sí, es una prioridad para mí.</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="indiferente"
                  checked={form.seguridadLGTB === "indiferente"}
                  onChange={handleChange}
                  id="seguridadLGTB-indiferente"
                />
                <label htmlFor="seguridadLGTB-indiferente">Sí, pero no es un requisito excluyente.</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="no"
                  checked={form.seguridadLGTB === "no"}
                  onChange={handleChange}
                  id="seguridadLGTB-no"
                />
                <label htmlFor="seguridadLGTB-no">No es algo que considere necesario.</label>
              </div>
            </div>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.seguridadLGTB}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 6 && (
          <div>
            <label>
              ¿En qué rango de fechas le gustaría viajar?:
            </label>
            <br />
            <label>
              Fecha de inicio:
              <input
                name="fechaInicio"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.fechaInicio}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.fechaInicio}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 7 && (
          <div>
            <label>¿Qué tan importante es la calidad del WiFi en el destino? (elige una opción)</label>
            <div>
              <div className="option-row">
                <input
                  type="radio"
                  name="internet"
                  value="si"
                  checked={form.internet === "si"}
                  onChange={handleChange}
                  id="internet-si"
                />
                <label htmlFor="internet-si">Muy importante</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="internet"
                  value="indiferente"
                  checked={form.internet === "indiferente"}
                  onChange={handleChange}
                  id="internet-indiferente"
                />
                <label htmlFor="internet-indiferente">Poco importante</label>
              </div>
              <div className="option-row">
                <input
                  type="radio"
                  name="internet"
                  value="no"
                  checked={form.internet === "no"}
                  onChange={handleChange}
                  id="internet-no"
                />
                <label htmlFor="internet-no">No importante</label>
              </div>
            </div>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.internet}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 8 && (
          <div>
            <label>
              ¿En qué idiomas te defiendes?:
              <input
                name="idiomas"
                type="text"
                value={form.idiomas}
                onChange={handleChange}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!form.idiomas.trim()}
            >
              Siguiente
            </button>
          </div>
        )}
        {currentPage === 9 && (
          <div>
            <label>
              ¿Tienes alguna preferencia que no se haya mencionado previamente?:
              <textarea
                name="preferencia"
                value={form.preferencia}
                onChange={handleChange}
                placeholder="Escribe aquí tus preferencias adicionales"
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="submit"
            >
              Enviar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}