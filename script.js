// ===============================
// SUPABASE
// ===============================
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ===============================
// TELEGRAM
// ===============================
const tg = window.Telegram.WebApp;
tg.expand();

if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
  alert("Открой через Telegram");
  throw new Error("Not Telegram WebApp");
}

const tgUser = tg.initDataUnsafe.user;

// ===============================
// INIT USER
// ===============================
let USER_ID = null;

async function initUser() {
  // 1. Проверяем пользователя
  let { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", tgUser.id)
    .single();

  // 2. Если нет — создаём
  if (!user) {
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name || null
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return;
    }

    await supabase.from("balances").insert({
      user_id: newUser.id,
      balance: 0
    });

    user = newUser;
  }

  USER_ID = user.id;
  loadBalance();
}

// ===============================
// BALANCE
// ===============================
async function loadBalance() {
  const { data, error } = await supabase
    .from("balances")
    .select("balance")
    .eq("user_id", USER_ID)
    .single();

  const balance = data?.balance ?? 0;

  document.getElementById("top-balance").innerText =
    `БАЛАНС: ${balance} VC`;
  document.getElementById("profile-balance").innerText =
    `Баланс: ${balance} VC`;
}

// ===============================
// POPUPS (ТВОЯ ЛОГИКА, НЕ МЕНЯЛ)
// ===============================
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

document.getElementById("wallet-open").onclick = () => openPopup("popup-wallet");
document.getElementById("close-wallet").onclick = () => closePopup("popup-wallet");

document.getElementById("open-deposit").onclick = () => openPopup("popup-deposit");
document.getElementById("close-deposit").onclick = () => closePopup("popup-deposit");

document.getElementById("to-payment").onclick = () => openPopup("popup-payment");
document.getElementById("close-payment").onclick = () => closePopup("popup-payment");

document.getElementById("open-withdraw").onclick = () => openPopup("popup-withdraw");
document.getElementById("close-withdraw").onclick = () => closePopup("popup-withdraw");

document.getElementById("open-requests").onclick = () => openPopup("popup-requests");
document.getElementById("close-requests").onclick = () => closePopup("popup-requests");

document.getElementById("btn-profile").onclick = () => openPopup("popup-profile");
document.getElementById("close-profile").onclick = () => closePopup("popup-profile");

document.getElementById("btn-bonus").onclick = () => openPopup("popup-bonus");
document.getElementById("close-bonus").onclick = () => closePopup("popup-bonus");

// ===============================
// START
// ===============================
initUser();
