/***********************
 * SUPABASE
 ***********************/
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

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
 * USER
 ***********************/
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

async function loadProfile() {
  const userId = await getOrCreateUser();

  const { data } = await supabase
    .from("profiles")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  $("top-balance").innerText = `БАЛАНС: ${data.balance} VC`;
  $("profile-balance").innerText = `Баланс: ${data.balance} VC`;
}

/***********************
 * DEPOSIT
 ***********************/
async function createDeposit(amount) {
  const userId = await getOrCreateUser();

  await supabase.from("deposits").insert({
    user_id: userId,
    amount: amount,
    status: "waiting" // ⏳ в процессе
  });
}

/***********************
 * ЗАЯВКИ
 ***********************/
function statusRu(status) {
  if (status === "waiting") return "⏳ В процессе";
  if (status === "success") return "✅ Успешно";
  if (status === "rejected") return "❌ Отказ";
  return status;
}

function statusClass(status) {
  if (status === "waiting") return "status-p";
  if (status === "success") return "status-c";
  if (status === "rejected") return "status-r";
  return "";
}

async function loadRequests() {
  const userId = localStorage.getItem("user_id");
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

  data.forEach((d) => {
    const date = new Date(d.created_at).toLocaleString("ru-RU");

    list.innerHTML += `
      <div class="item">
        <div>
          <b>${d.amount} ₽</b>
          <div class="meta">${date}</div>
        </div>
        <div class="${statusClass(d.status)}">
          ${statusRu(d.status)}
        </div>
      </div>
    `;
  });
}

/***********************
 * DOM READY
 ***********************/
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();

  /* КОШЕЛЁК */
  $("wallet-open").onclick = () => openPopup("popup-wallet");
  $("close-wallet").onclick = () => closePopup("popup-wallet");

  /* ПОПОЛНЕНИЕ */
  $("open-deposit").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  };

  $("close-deposit").onclick = () => closePopup("popup-deposit");

  $("to-payment").onclick = async () => {
    const amount = Number($("deposit-amount").value);
    if (!amount || amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    await createDeposit(amount);
    $("pay-amount-text").innerText = amount + " ₽";

    closePopup("popup-deposit");
    openPopup("popup-payment");
  };

  /* Я ОПЛАТИЛ */
  $("confirm-paid").onclick = () => {
    alert("✅ Заявка отправлена и находится в обработке");
    closePopup("popup-payment");
  };

  /* ЗАЯВКИ */
  $("open-requests").onclick = async () => {
    closePopup("popup-wallet");
    await loadRequests();
    openPopup("popup-requests");
  };

  $("close-requests").onclick = () => closePopup("popup-requests");

  /* ПРОФИЛЬ */
  $("btn-profile").onclick = () => openPopup("popup-profile");
  $("close-profile").onclick = () => closePopup("popup-profile");

  /* БОНУСЫ */
  $("btn-bonus").onclick = () => openPopup("popup-bonus");
  $("close-bonus").onclick = () => closePopup("popup-bonus");

  $("bonus-promocode").onclick = () => {
    closePopup("popup-bonus");
    openPopup("popup-promocode");
  };

  $("close-promocode").onclick = () => closePopup("popup-promocode");

  $("bonus-referral").onclick = () => {
    closePopup("popup-bonus");
    openPopup("popup-referral");
  };

  $("close-referral").onclick = () => closePopup("popup-referral");
});
