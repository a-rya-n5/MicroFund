async function loadBorrowerDashboard() {
  try {
    const loans = await apiFetch("/loans/my");

    let totalLoan = 0;
    let emi = 0;

    loans.forEach(l => {
      totalLoan += l.amount;
      emi += l.emi;
    });

    document.getElementById("totalLoan").innerText = "₹" + totalLoan;
    document.getElementById("monthlyEmi").innerText = "₹" + emi;
    document.getElementById("loanCount").innerText = loans.length;

  } catch (err) {
    alert(err.message);
  }
}

loadBorrowerDashboard();
