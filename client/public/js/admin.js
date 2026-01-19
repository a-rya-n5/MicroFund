async function loadAdminDashboard() {
  try {
    // Fetch stats
    const stats = await apiFetch("/admin/stats");
    document.getElementById("totalUsers").innerText = stats.users;
    document.getElementById("activeLoans").innerText = stats.activeLoans;
    document.getElementById("totalCapital").innerText = "₹" + (stats.capital / 10000000).toFixed(1) + " Cr";

    // Fetch pending loans
    const loans = await apiFetch("/loans/pending");
    document.getElementById("pendingApprovals").innerText = loans.length;

    const tbody = document.getElementById("loanTableBody");
    tbody.innerHTML = "";

    loans.forEach(loan => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${loan.borrowerName}</td>
        <td>₹${loan.amount}</td>
        <td>${loan.tenure} months</td>
        <td>${loan.creditScore}</td>
        <td>
          <button class="approve-btn" onclick="approveLoan('${loan._id}')">Approve</button>
          <button class="reject-btn" onclick="rejectLoan('${loan._id}')">Reject</button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    alert(err.message);
  }
}

loadAdminDashboard();
