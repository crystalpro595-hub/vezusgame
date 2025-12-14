// ===============================
// SUPABASE
// ===============================
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===============================
// USER
// ===============================
async function getOrCreateUser() {
  let userId = localStorage.getItem("user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);

    await supabase.from("Users").insert({ id: userId });
    await supabase.from("profiles").insert({
      user_id: userId,
      balance: 0,
      level: 1,
      exp: 0
    });
  }

  return userId;
}

// ===============================
// PROFILE LOAD
// ===============================
async function loadProfile() {
  const userId = await getOrCreateUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("top-balance").innerText =
    "БАЛАНС: " + data.balance + " VC";

  document.getElementById("profile-balance").innerText =
    "Баланс: " + data.balance + " VC";
}

window.addEventListener("load", loadProfile);

// ===============================
// POPUPS
// ===============================
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  // Wallet
  document.getElementById("wallet-open").onclick =
    () => openPopup("popup-wallet");
  document.getElementById("close-wallet").onclick =
    () => closePopup("popup-wallet");

  // Deposit
  document.getElementById("open-deposit").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  };
  document.getElementById("close-deposit").onclick =
    () => closePopup("popup-deposit");

  // Payment
  document.getElementById("to-payment").onclick = () => {
    const amount = document.getElementById("deposit-amount").value;
    if (!amount || amount < 100) {
      alert("Минимальная сумма — 100 ₽");
      return;
    }

    document.getElementById("pay-amount-text").textContent = amount + " ₽";
    closePopup("popup-deposit");
    openPopup("popup-payment");
  };

  document.getElementById("close-payment").onclick =
    () => closePopup("popup-payment");

  // Withdraw
  document.getElementById("open-withdraw").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-withdraw");
  };
  document.getElementById("close-withdraw").onclick =
    () => closePopup("popup-withdraw");

  // Requests
  document.getElementById("open-requests").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-requests");
  };
  document.getElementById("close-requests").onclick =
    () => closePopup("popup-requests");

  // Profile
  document.getElementById("btn-profile").onclick =
    () => openPopup("popup-profile");
  document.getElementById("close-profile").onclick =
    () => closePopup("popup-profile");

  // Bonus
  document.getElementById("btn-bonus").onclick =
    () => openPopup("popup-bonus");
  document.getElementById("close-bonus").onclick =
    () => closePopup("popup-bonus");

  // Promocode
  document.getElementById("bonus-promocode").onclick = () => {
    closePopup("popup-bonus");
    openPopup("popup-promocode");
  };
  document.getElementById("close-promocode").onclick =
    () => closePopup("popup-promocode");

  // Referral
  document.getElementById("bonus-referral").onclick = () => {
    closePopup("popup-bonus");
    openPopup("popup-referral");
  };
  document.getElementById("close-referral").onclick =
    () => closePopup("popup-referral");
});
