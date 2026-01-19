async function loadLenderDashboard() {
  try {
    const wallet = await apiFetch("/wallet/me");
    const investments = await apiFetch("/transactions/my-investments");

    let invested = 0;
    investments.forEach(i => invested += i.amount);

    document.getElementById("walletBalance").innerText = "₹" + wallet.balance;
    document.getElementById("totalInvested").innerText = "₹" + invested;
    document.getElementById("activeLoans").innerText = investments.length;

  } catch (err) {
    alert(err.message);
  }
}

loadLenderDashboard();
