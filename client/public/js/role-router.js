/**
 * roleRouter.js
 * ---------------------------------
 * Centralized role-based redirection
 * Used immediately after login
 * Used on protected pages
 */

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function redirectByRole() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = parseJwt(token);

  if (!payload || !payload.role) {
    localStorage.removeItem("token");
    window.location.href = "index.html";
    return;
  }

  switch (payload.role) {
    case "borrower":
      window.location.href = "borrower-dashboard.html";
      break;

    case "lender":
      window.location.href = "lender-dashboard.html";
      break;

    case "admin":
      window.location.href = "admin-dashboard.html";
      break;

    default:
      localStorage.removeItem("token");
      window.location.href = "index.html";
  }
}
