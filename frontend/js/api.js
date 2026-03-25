const BASE_URL = "http://127.0.0.1:5000";

export async function login(username, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

export async function register(data) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });

  return res.json();
}