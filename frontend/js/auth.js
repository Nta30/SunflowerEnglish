import { login, register } from "./api.js";

function checkTokenValidity(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem("token");
  return !!token && checkTokenValidity(token);
}

export function saveAuth(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user_info", JSON.stringify(data.user));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_info");
}

export async function handleAuth(isLoginView, payload) {
  if (isLoginView) {
    return await login(payload.username, payload.password);
  } else {
    return await register(payload);
  }
}
