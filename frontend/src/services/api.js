const API_URL = "http://127.0.0.1:8000"

export async function obtenerReportes() {

  const respuesta = await fetch(`${API_URL}/reportes`)

  return await respuesta.json()

}

export async function crearReporte(data) {

  const respuesta = await fetch(`${API_URL}/reportes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  return await respuesta.json()

}