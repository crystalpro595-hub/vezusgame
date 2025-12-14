/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ================= USER ================= */

async function getOrCreateUser() {
  let userId = localStorage.getItem("user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);

    await supabase.from("profiles").insert({
      user_id: userId,
      balance: 0
    });
  }

  return userId;
}

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

/* ================= DEPOSIT ================= */

async function createDeposit(amount) {
  const userId = localStorage.getItem("user_id");

  const { error } = await supabase.from("deposits").insert({
    user_id: userId,
    amount: Number(amount),
    status: "pending"
  });

  if (error) {
    console.error(error);
    alert("Ошибка при создании депозита");
    return false;
  }

  return true;
}

/* ================= POPUPS ================= */

function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

function closeAllPopups() {
  document.querySelectorAll(".popup").forEach(p => {
    p.style.display = "none";
  });
}

/* ================= EVENTS ================= */

document.addEventListener("DOMContentLoaded", () => {

  loadProfile();

  /* === WALLET === */
  document.getElementById("wallet-open").onclick = () =>
    openPopup("popup-wallet");

  document.getElementById("close-wallet").onclick = () =>
    closePopup("popup-wallet");

  /* === DEPOSIT === */
  document.getElementById("open-deposit").onclick = () => {
    closeAllPopups();
    openPopup("popup-deposit");
  };

  document.getElementById("close-deposit").onclick = () =>
    closePopup("popup-deposit");

  document.getElementById("deposit-amount").oninput = e => {
    document.getElementById("vc-estimate").innerText =
      (Number(e.target.value) || 0) + " VC";
  };

  document.getElementById("to-payment").onclick = () => {
    const amount = Number(
      document.getElementById("deposit-amount").value
    );

    if (amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    document.getElementById("pay-amount-text").innerText =
      amount + " ₽";

    closeAllPopups();
    openPopup("popup-payment");
  };

  document.getElementById("close-payment").onclick = () =>
    closePopup("popup-payment");

  document.getElementById("confirm-paid").onclick = async () => {
    const amount = parseInt(
      document.getElementById("pay-amount-text").innerText
    );

    const ok = await createDeposit(amount);
    if (!ok) return;

    alert("Заявка на пополнение создана");
    closePopup("popup-payment");
  };

  /* === WITHDRAW (заглушка) === */
  document.getElementById("open-withdraw").onclick = () => {
    closeAllPopups();
    openPopup("popup-withdraw");
  };

  document.getElementById("close-withdraw").onclick = () =>
    closePopup("popup-withdraw");

  /* === REQUESTS === */
  document.getElementById("open-requests").onclick = () => {
    closeAllPopups();
    openPopup("popup-requests");
  };

  document.getElementById("close-requests").onclick = () =>
    closePopup("popup-requests");

  /* === PROFILE === */
  document.getElementById("btn-profile").onclick = () =>
    openPopup("popup-profile");

  document.getElementById("close-profile").onclick = () =>
    closePopup("popup-profile");

  /* === BONUS === */
  document.getElementById("btn-bonus").onclick = () =>
    openPopup("popup-bonus");

  document.getElementById("close-bonus").onclick = () =>
    closePopup("popup-bonus");

  /* === PROMOCODE (пока UI) === */
  document.getElementById("bonus-promocode").onclick = () => {
    closeAllPopups();
    openPopup("popup-promocode");
  };

  document.getElementById("close-promocode").onclick = () =>
    closePopup("popup-promocode");

  /* === REFERRAL === */
  document.getElementById("bonus-referral").onclick = () => {
    closeAllPopups();
    openPopup("popup-referral");
  };

  document.getElementById("close-referral").onclick = () =>
    closePopup("popup-referral");
});
