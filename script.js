// ===============================
// SUPABASE
// ===============================
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_KEY = "ТВОЙ_ANON_KEY";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ===============================
// TELEGRAM
// ===============================
const tg = window.Telegram.WebApp;
tg.expand();

if (!tg.initDataUnsafe?.user) {
  alert("Открой через Telegram");
  throw new Error("Not Telegram WebApp");
}

const tgUser = tg.initDataUnsafe.user;

// ===============================
// INIT USER
// ===============================
async function initUser() {
  let { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", tgUser.id)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        telegram_id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name
      })
      .select()
      .single();

    await supabase
      .from("balances")
      .insert({ user_id: newUser.id, balance: 0 });

    user = newUser;
  }

  window.USER_ID = user.id;
  loadBalance();
}

// ===============================
// BALANCE
// ===============================
async function loadBalance() {
  const { data } = await supabase
    .from("balances")
    .select("balance")
    .eq("user_id", window.USER_ID)
    .single();

  const balance = data?.balance ?? 0;

  document.getElementById("top-balance").innerText =
    `БАЛАНС: ${balance} VC`;
  document.getElementById("profile-balance").innerText =
    `Баланс: ${balance} VC`;
}

// ===============================
// POPUPS
// ===============================
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

// Навешиваем ТОЛЬКО после загрузки DOM
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("wallet-open").onclick =
    () => openPopup("popup-wallet");
  document.getElementById("close-wallet").onclick =
    () => closePopup("popup-wallet");

  document.getElementById("open-deposit").onclick =
    () => openPopup("popup-deposit");
  document.getElementById("close-deposit").onclick =
    () => closePopup("popup-deposit");

  document.getElementById("to-payment").onclick =
    () => openPopup("popup-payment");
  document.getElementById("close-payment").onclick =
    () => closePopup("popup-payment");

  document.getElementById("open-withdraw").onclick =
    () => openPopup("popup-withdraw");
  document.getElementById("close-withdraw").onclick =
    () => closePopup("popup-withdraw");

  document.getElementById("open-requests").onclick =
    () => openPopup("popup-requests");
  document.getElementById("close-requests").onclick =
    () => closePopup("popup-requests");

  document.getElementById("btn-profile").onclick =
    () => openPopup("popup-profile");
  document.getElementById("close-profile").onclick =
    () => closePopup("popup-profile");

  document.getElementById("btn-bonus").onclick =
    () => openPopup("popup-bonus");
  document.getElementById("close-bonus").onclick =
    () => closePopup("popup-bonus");

  initUser();
});
