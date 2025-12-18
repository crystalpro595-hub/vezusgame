/***********************
 * SUPABASE
 ***********************/
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/***********************
 * HELPERS
 ***********************/
const $ = (id) => document.getElementById(id);

function openPopup(id) {
  const el = $(id);
  if (el) el.style.display = "flex";
}

function closePopup(id) {
  const el = $(id);
  if (el) el.style.display = "none";
}

/***********************
 * TELEGRAM AUTH
 ***********************/
window.onTelegramAuth = async function (user) {
  const tgId = String(user.id);

  localStorage.setItem("user_id", tgId);
  localStorage.setItem("tg_username", user.username || "");
  localStorage.setItem("tg_name", user.first_name || "");

  // users
  await supabase.from("Users").upsert({
    id: tgId
  });

  // profile
  await supabase.from("profiles").upsert({
    user_id: tgId,
    telegram_username: user.username || null,
    telegram_name: user.first_name || null,
    balance: 0
  });

  await loadProfile();
};

/***********************
 * USER
 ***********************/
function getUserId() {
  return localStorage.getItem("user_id");
}

/***********************
 * PROFILE
 ***********************/
async function loadProfile() {
  const userId = getUserId();
  if (!userId) return;

  const { data } = await supabase
    .from("profiles")
    .select("balance, telegram_username, telegram_name")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  $("top-balance").innerText = `БАЛАНС: ${data.balance} VC`;
  $("profile-balance").innerHTML = `
    Баланс: <b>${data.balance} VC</b><br>
    Telegram ID: <b>${userId}</b><br>
    Ник: <b>@${data.telegram_username || "—"}</b>
  `;
}

/***********************
 * DEPOSIT
 ***********************/
async function createDeposit(amount) {
  const userId = getUserId();
  if (!userId) {
    alert("Войдите через Telegram");
    return;
  }

  await supabase.from("deposits").insert({
    user_id: userId,
    amount,
    status: "waiting"
  });
}

/***********************
 * REQUESTS
 ***********************/
async function loadRequests() {
  const userId = getUserId();
  if (!userId) return;

  const { data } = await supabase
    .from("deposits")
    .select("amount, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const list = $("requests-list");
  list.innerHTML = "";

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="meta">Заявок пока нет</div>`;
    return;
  }

  data.forEach(d => {
    let status = "⏳ В процессе";
    let cls = "status-p";
    if (d.status === "success") { status = "✅ Успешно"; cls = "status-c"; }
    if (d.status === "rejected") { status = "❌ Отказ"; cls = "status-r"; }

    list.innerHTML += `
      <div class="item">
        <div>
          <b>${d.amount} ₽</b>
          <div class="meta">${new Date(d.created_at).toLocaleString()}</div>
        </div>
        <div class="${cls}">${status}</div>
      </div>
    `;
  });
}

/***********************
 * DOM READY
 ***********************/
document.addEventListener("DOMContentLoaded", async () => {
  if (getUserId()) await loadProfile();

  $("wallet-open").onclick = () => openPopup("popup-wallet");
  $("close-wallet").onclick = () => closePopup("popup-wallet");

  $("open-deposit").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  };

  $("to-payment").onclick = async () => {
    const amount = Number($("deposit-amount").value);
    if (amount < 100) return alert("Минимум 100 ₽");
    await createDeposit(amount);
    $("pay-amount-text").innerText = amount + " ₽";
    closePopup("popup-deposit");
    openPopup("popup-payment");
  };

  $("confirm-paid").onclick = () => {
    alert("Заявка отправлена");
    closePopup("popup-payment");
  };

  $("open-requests").onclick = async () => {
    closePopup("popup-wallet");
    await loadRequests();
    openPopup("popup-requests");
  };

  $("btn-profile").onclick = () => openPopup("popup-profile");
});
