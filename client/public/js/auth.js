const API = "http://localhost:5000/api";

async function login() {
  const email = email.value;
  const password = password.value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  localStorage.setItem("token", data.token);
  window.location = "dashboard.html";
}

async function register() {
  const name = name.value;
  const email = email.value;
  const password = password.value;
  const role = role.value;

  await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  window.location = "index.html";
}

function logout() {
  localStorage.clear();
  window.location = "index.html";
}
