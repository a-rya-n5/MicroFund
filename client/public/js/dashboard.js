const token = localStorage.getItem("token");
const API = "http://localhost:5000/api";

if (!token) window.location = "index.html";

async function loadDashboard() {
  const res = await fetch(`${API}/credit/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  document.getElementById("info").innerHTML = `
    <h3>Credit Score: ${data.creditScore}</h3>
  `;
}

loadDashboard();
