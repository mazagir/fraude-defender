// frontend/src/components/Login.jsx
import { useState } from 'react';

export function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // FastAPI espera los datos en formato URL-Encoded para OAuth2
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.access_token); // Guardamos el pase de acceso
      onLogin(); // Avisamos a App.jsx que ya estamos autenticados
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="text" placeholder="Usuario" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Ingresar</button>
    </form>
  );
}