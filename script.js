<script>

const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// === ПОЛУЧАЕМ ИЛИ СОЗДАЁМ ИГРОКА ===
async function getOrCreateUser() {
  let userId = localStorage.getItem("user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);

    await supabase.from("Users").insert({
      id: userId
    });

    await supabase.from("profiles").insert({
      user_id: userId,
      balance: 0,
      level: 1,
      exp: 0
    });
  }

  return userId;
}

// === ПОЛУЧАЕМ ПРОФИЛЬ ===
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

window.addEventListener("load", () => {
  loadProfile();
});
</script>

/* === инициализация Supabase (если нужно) === */
const supabaseUrl = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const supabaseKey = "PUBLIC-KEY-HERE"; // вставь свой public anon key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/* === ФУНКЦИИ ПОПАПОВ === */
function openPopup(id) {
    document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
    document.getElementById(id).style.display = "none";
}

/* === ЖДЁМ ПОЛНУЮ ЗАГРУЗКУ DOM === */
document.addEventListener("DOMContentLoaded", () => {

    /* === КОШЕЛЁК === */
    const walletBtn = document.getElementById("wallet-open");
    const closeWallet = document.getElementById("close-wallet");
    walletBtn.onclick = () => openPopup("popup-wallet");
    closeWallet.onclick = () => closePopup("popup-wallet");

    /* === ПОПОЛНЕНИЕ === */
    document.getElementById("open-deposit").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-deposit");
    };
    document.getElementById("close-deposit").onclick = () =>
        closePopup("popup-deposit");

    /* === ОПЛАТА === */
    document.getElementById("to-payment").onclick = () => {
        const amount = document.getElementById("deposit-amount").value;
        if (!amount || amount < 100) return alert("Минимум 100 ₽");

        document.getElementById("pay-amount-text").textContent = amount + " ₽";

        closePopup("popup-deposit");
        openPopup("popup-payment");
    };
    document.getElementById("close-payment").onclick = () =>
        closePopup("popup-payment");

    /* === ВЫВОД === */
    document.getElementById("open-withdraw").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-withdraw");
    };
    document.getElementById("close-withdraw").onclick = () =>
        closePopup("popup-withdraw");

    /* === ЗАЯВКИ === */
    document.getElementById("open-requests").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-requests");
    };
    document.getElementById("close-requests").onclick = () =>
        closePopup("popup-requests");

    /* === ПРОФИЛЬ === */
    document.getElementById("btn-profile").onclick = () =>
        openPopup("popup-profile");
    document.getElementById("close-profile").onclick = () =>
        closePopup("popup-profile");

    /* === БОНУСЫ === */
    document.getElementById("btn-bonus").onclick = () =>
        openPopup("popup-bonus");
    document.getElementById("close-bonus").onclick = () =>
        closePopup("popup-bonus");

    /* === ПРОМОКОД === */
    document.getElementById("bonus-promocode").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-promocode");
    };
    document.getElementById("close-promocode").onclick = () =>
        closePopup("popup-promocode");

    /* === РЕФЕРАЛКА === */
    document.getElementById("bonus-referral").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-referral");
    };
    document.getElementById("close-referral").onclick = () =>
        closePopup("popup-referral");
});
