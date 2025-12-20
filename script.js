// ===============================
// SUPABASE
// ===============================
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_KEY = "PASTE_ANON_KEY_HERE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// TELEGRAM
// ===============================
const tg = window.Telegram.WebApp;
tg.expand();

if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
  alert("Открой через Telegram");
}

const tgUser = tg.initDataUnsafe.user;

// ===============================
// INIT USER
// ===============================
async function initUser() {
  // 1. Проверяем пользователя
  let { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", tgUser.id)
    .single();

  // 2. Если нет — создаём
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

  const balance = data?.balance || 0;
  document.getElementById("top-balance").innerText = `БАЛАНС: ${balance} VC`;
  document.getElementById("profile-balance").innerText = `Баланс: ${balance} VC`;
}

// ===============================
// POPUPS (ПОЧЕМУ НЕ ОТКРЫВАЛИСЬ)
// ===============================
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

// WALLET
document.getElementById("wallet-open").onclick = () => openPopup("popup-wallet");
document.getElementById("close-wallet").onclick = () => closePopup("popup-wallet");

// DEPOSIT
document.getElementById("open-deposit").onclick = () => openPopup("popup-deposit");
document.getElementById("close-deposit").onclick = () => closePopup("popup-deposit");

// PAYMENT
document.getElementById("to-payment").onclick = () => openPopup("popup-payment");
document.getElementById("close-payment").onclick = () => closePopup("popup-payment");

// WITHDRAW
document.getElementById("open-withdraw").onclick = () => openPopup("popup-withdraw");
document.getElementById("close-withdraw").onclick = () => closePopup("popup-withdraw");

// REQUESTS
document.getElementById("open-requests").onclick = () => openPopup("popup-requests");
document.getElementById("close-requests").onclick = () => closePopup("popup-requests");

// PROFILE
document.getElementById("btn-profile").onclick = () => openPopup("popup-profile");
document.getElementById("close-profile").onclick = () => closePopup("popup-profile");

// BONUS
document.getElementById("btn-bonus").onclick = () => openPopup("popup-bonus");
document.getElementById("close-bonus").onclick = () => closePopup("popup-bonus");

// START
initUser();
