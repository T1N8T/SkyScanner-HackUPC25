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
      } else {
        alert("Solo puedes seleccionar hasta 2 opciones.");
      }
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        interes: prevForm.interes.filter((item) => item !== value),
      }));
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
    return (
      <div>
        <h2>Recomendación personalizada</h2>
        {cargando && <p>Cargando recomendación...</p>}
        {!cargando && (
          <div>
            <p>{recomendacion}</p>
            <button onClick={() => window.location.reload()}>Volver a empezar</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1>Mípalo</h1>
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
              <label>
                <input
                  type="checkbox"
                  name="interes"
                  value="nocturno"
                  checked={form.interes.includes("nocturno")}
                  onChange={handleCheckboxChange}
                />
              Vida nocturna y entretenimiento
              </label>
              <br />
              <label>
                <input
                  type="checkbox"
                  name="interes"
                  value="playa"
                  checked={form.interes.includes("playa")}
                  onChange={handleCheckboxChange}
                />
                Playa
              </label>
              <br />
              <label>
                <input
                  type="checkbox"
                  name="interes"
                  value="arte"
                  checked={form.interes.includes("arte")}
                  onChange={handleCheckboxChange}
                />
                Arte y cultura
              </label>
              <br />
              <label>
                <input
                  type="checkbox"
                  name="interes"
                  value="comida"
                  checked={form.interes.includes("comida")}
                  onChange={handleCheckboxChange}
                />
                Buena comida
              </label>
              <br />
              <label>
                <input
                  type="checkbox"
                  name="interes"
                  value="aventuras"
                  checked={form.interes.includes("aventuras")}
                  onChange={handleCheckboxChange}
                />
                Aventuras al aire libre
              </label>
            </div>
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
                min="0"
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
              <label>
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="si"
                  checked={form.seguridadmuj === "si"}
                  onChange={handleChange}
                />
               Sí, es una prioridad para mí.
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="no"
                  checked={form.seguridadmuj === "no"}
                  onChange={handleChange}
                />
                No es algo que considere necesario.
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="seguridadmuj"
                  value="indiferente"
                  checked={form.seguridadmuj === "indiferente"}
                  onChange={handleChange}
                />
                Sí, pero no es un requisito excluyente.
              </label>
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
              <label>
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="si"
                  checked={form.seguridadLGTB === "si"}
                  onChange={handleChange}
                />
                Sí, es una prioridad para mí.
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="no"
                  checked={form.seguridadLGTB === "no"}
                  onChange={handleChange}
                />
                No es algo que considere necesario.
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="seguridadLGTB"
                  value="indiferente"
                  checked={form.seguridadLGTB === "indiferente"}
                  onChange={handleChange}
                />
                Sí, pero no es un requisito excluyente.
              </label>
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
              <label>
                <input
                  type="radio"
                  name="internet"
                  value="si"
                  checked={form.internet === "si"}
                  onChange={handleChange}
                />
                Muy importante
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="internet"
                  value="indiferente"
                  checked={form.internet === "indiferente"}
                  onChange={handleChange}
                />
                Poco importante
              </label>
              <br />
              <label>
                <input
                  type="radio"
                  name="internet"
                  value="no"
                  checked={form.internet === "no"}
                  onChange={handleChange}
                />
                No importante
              </label>
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
                required
              />
            </label>
            <br />
            <button type="button" onClick={prevPage}>
              Anterior
            </button>
            <button
              type="submit"
              disabled={!form.preferencia.trim()}
            >
              Enviar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}