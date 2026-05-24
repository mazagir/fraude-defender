const API = "https://fraude-defender-api.onrender.com";

export default API;

export const getToken = () => localStorage.getItem("fd_token");

export const getUsuario = () =>
  JSON.parse(localStorage.getItem("fd_usuario") || "null");

export const setAuth = (token, usuario) => {
  localStorage.setItem("fd_token", token);
  localStorage.setItem("fd_usuario", JSON.stringify(usuario));
};

export const clearAuth = () => {
  localStorage.removeItem("fd_token");
  localStorage.removeItem("fd_usuario");
};

export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});