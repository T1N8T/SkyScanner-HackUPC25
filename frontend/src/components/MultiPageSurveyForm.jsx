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
    fechaFinal: "",
    internet: "",
    alojamiento: "",
    leyes: "",
    seguirdad: "",
    preferencia: "",
  });
  const [currentPage, setCurrentPage] = useState(0); // Controla la página actual
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      if (form.interes.length < 3) {
        setForm((prevForm) => ({
          ...prevForm,
          interes: [...prevForm.interes, value],
        }));
      } else {
        alert("Solo puedes seleccionar hasta 3 opciones.");
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
    await fetch("http://localhost:5000/api/submit-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEnviado(true);
  };

  const nextPage = () => setCurrentPage((prev) => prev + 1);
  const prevPage = () => setCurrentPage((prev) => prev - 1);

  if (enviado) {
    return <p>¡Gracias por responder!</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {currentPage === 0 && (
        <div>
          <label>
            Cuál es tu nombre?
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}

      {currentPage === 1 && (
        <div>
          <label>¿Qué tipo de experiencias buscas principalmente en un viaje? (elige hasta 3)</label>
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
                value="Playa"
                checked={form.interes.includes("Playa")}
                onChange={handleCheckboxChange}
              />
              Playa
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                name="interes"
                value="Arte"
                checked={form.interes.includes("Arte")}
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
          <button type="button" onClick={nextPage}>
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
              onChange={handleChange}
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
        <button type="button" onClick={nextPage}>
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
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
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
        <button type="button" onClick={nextPage}>
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
            <button type="button" onClick={nextPage}>
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
        <label>
          Fecha final:
          <input
            name="fechaFinal"
            type="date"
            value={form.fechaFinal}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <button type="button" onClick={prevPage}>
          Anterior
        </button>
        <button type="button" onClick={nextPage}>
          Siguiente
        </button>
      </div>
    )}
      {currentPage === 7 && (
        <div>
          <label>
            Pregunta 8 (Texto por defecto):
            <input
              name="pregunta8"
              value={form.pregunta8}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}
      {currentPage === 8 && (
        <div>
          <label>
            Pregunta 9 (Texto por defecto):
            <input
              name="pregunta9"
              value={form.pregunta9}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}
       {currentPage === 9 && (
        <div>
          <label>
            Pregunta 10 (Texto por defecto):
            <input
              name="pregunta10"
              value={form.pregunta10}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}
      {currentPage === 10 && (
        <div>
          <label>
            Pregunta 11 (Texto por defecto):
            <input
              name="pregunta11"
              value={form.pregunta11}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}
      {currentPage === 11 && (
        <div>
          <label>
            Pregunta 12 (Texto por defecto):
            <input
              name="pregunta12"
              value={form.pregunta12}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="button" onClick={nextPage}>
            Siguiente
          </button>
        </div>
      )}
      {currentPage === 12 && (
        <div>
          <label>
            Pr (Texto por defecto):
            <input
              name="pregunta13"
              value={form.pregunta13}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="submit">Enviar</button>
        </div>
      )}
      {currentPage === 13 && (
        <div>
          <label>
            Pr (Texto por defecto):
            <input
              name="pregunta14"
              value={form.pregunta14}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="button" onClick={prevPage}>
            Anterior
          </button>
          <button type="submit">Enviar</button>
        </div>
      )}
    </form>
  );
}