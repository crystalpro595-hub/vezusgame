document.addEventListener("DOMContentLoaded", () => {

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
    return;
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
    // === Профиль: данные Telegram ===
const name =
  tgUser.first_name +
  (tgUser.last_name ? " " + tgUser.last_name : "");

document.getElementById("profile-user").innerText =
  `👤 ${name} | ID: ${tgUser.id}`;
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
// HISTORY (DEPOSITS)
// ===============================
async function loadHistory() {
  const { data, error } = await supabase
    .from("deposits")
    .select("amount_vc, status, created_at")
    .eq("user_id", window.USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("HISTORY ERROR:", error);
    return;
  }

  const list = document.getElementById("history-list");
  list.innerHTML = "";

  if (!data || data.length === 0) {
    list.innerHTML = "<div class='meta'>Операций пока нет</div>";
    return;
  }

  data.forEach(d => {
    let statusText = "⏳ В обработке";
    if (d.status === "success") statusText = "✅ Зачислено";
    if (d.status === "rejected") statusText = "❌ Отказ";

    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div>
        <b>➕ Пополнение</b>
        <div class="meta">${new Date(d.created_at).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <b>${d.amount_vc} VC</b><br>
        <span class="meta">${statusText}</span>
      </div>
    `;

    list.appendChild(item);
  });
}
  
  // ===============================
  // POPUPS
  // ===============================
  const openPopup = id => document.getElementById(id).style.display = "flex";
  const closePopup = id => document.getElementById(id).style.display = "none";

  document.getElementById("wallet-open").onclick = () => openPopup("popup-wallet");
  document.getElementById("close-wallet").onclick = () => closePopup("popup-wallet");

  document.getElementById("open-deposit").onclick = () => openPopup("popup-deposit");
  document.getElementById("close-deposit").onclick = () => closePopup("popup-deposit");

  document.getElementById("to-payment").onclick = () => openPopup("popup-payment");
  document.getElementById("close-payment").onclick = () => closePopup("popup-payment");

  document.getElementById("open-withdraw").onclick = () => openPopup("popup-withdraw");
  document.getElementById("close-withdraw").onclick = () => closePopup("popup-withdraw");

  document.getElementById("btn-profile").onclick = () => {
  openPopup("popup-profile");
  loadHistory();
};
  document.getElementById("close-profile").onclick = () => closePopup("popup-profile");

  document.getElementById("btn-bonus").onclick = () => openPopup("popup-bonus");
  document.getElementById("close-bonus").onclick = () => closePopup("popup-bonus");

  document.getElementById("bonus-promocode").onclick = () => openPopup("popup-promocode");
  document.getElementById("close-promocode").onclick = () => closePopup("popup-promocode");

  document.getElementById("bonus-referral").onclick = () => openPopup("popup-referral");
  document.getElementById("close-referral").onclick = () => closePopup("popup-referral");

  // ===============================
  // START
  // ===============================

// ===============================
// DEPOSIT (создание заявки)
// ===============================
const depositInput = document.getElementById("deposit-amount");
const vcEstimate = document.getElementById("vc-estimate");

// Подсчёт VC
depositInput.addEventListener("input", () => {
  const value = parseInt(depositInput.value || 0);
  vcEstimate.innerText = `${value} VC`;
});

// Переход к оплате
document.getElementById("to-payment").onclick = () => {
  const amount = parseInt(depositInput.value);

  if (!amount || amount < 100) {
    alert("Минимум 100 ₽");
    return;
  }

  document.getElementById("pay-amount-text").innerText = `${amount} ₽`;
  document.getElementById("popup-payment").style.display = "flex";
};

// Я оплатил
document.getElementById("confirm-paid").onclick = async () => {
  const amount = parseInt(depositInput.value);

  if (!amount || amount < 100) {
    alert("Ошибка суммы");
    return;
  }

  const { error } = await supabase.from("deposits").insert({
    user_id: window.USER_ID,
    amount_vc: amount,
    status: "waiting"
  });

  if (error) {
    console.error(error);
    alert("Ошибка создания заявки");
    return;
  }

  document.getElementById("popup-payment").style.display = "none";
  document.getElementById("popup-deposit").style.display = "none";

  alert("Заявка отправлена. Ожидайте подтверждения.");
};

// ===============================
// WITHDRAW REQUEST
// ===============================
document.getElementById("confirm-withdraw").onclick = async () => {
  const amount = parseFloat(
    document.getElementById("withdraw-amount").value
  );

  const requisites = document
    .getElementById("withdraw-wallet")
    .value
    .trim();

  if (!amount || amount <= 0) {
    alert("Введите сумму");
    return;
  }

  if (!requisites) {
    alert("Введите реквизиты");
    return;
  }

  const { error } = await supabase
    .from("withdrawals")
    .insert({
      user_id: window.USER_ID,
      amount: amount,
      requisites: requisites,
      status: "waiting"
    });

  if (error) {
    console.error("WITHDRAW ERROR:", error);
    alert(error.message);
    return;
  }

  document.getElementById("withdraw-amount").value = "";
  document.getElementById("withdraw-wallet").value = "";

  document.getElementById("popup-withdraw").style.display = "none";
  alert("Заявка на вывод отправлена");
};
