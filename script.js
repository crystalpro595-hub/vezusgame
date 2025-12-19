// =============================
// 🔑 НАСТРОЙКИ (ВСТАВЛЕНО)
// =============================
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

// =============================
// 📦 SUPABASE INIT
// =============================
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =============================
// 📲 TELEGRAM AUTH
// =============================
let tgUser = null;
let USER_ID = null;

function initTelegram() {
  if (!window.Telegram || !Telegram.WebApp) {
    alert("❌ Открой через Telegram");
    return;
  }

  const tg = Telegram.WebApp;
  tg.ready();

  tgUser = tg.initDataUnsafe?.user;

  if (!tgUser) {
    alert("❌ Не удалось получить Telegram user");
    return;
  }

  USER_ID = tgUser.id;

  console.log("TG USER:", tgUser);

  syncUser();
}

// =============================
// 👤 SYNC USER WITH DB
// =============================
async function syncUser() {
  const { data, error } = await supabase
    .from("users")
    .select("id, balance")
    .eq("id", USER_ID)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("USER LOAD ERROR", error);
    return;
  }

  if (!data) {
    // create user
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: USER_ID,
        username: tgUser.username || null,
        first_name: tgUser.first_name || null,
        balance: 0
      });

    if (insertError) {
      console.error("USER CREATE ERROR", insertError);
      return;
    }

    updateBalance(0);
  } else {
    updateBalance(data.balance);
  }
}

// =============================
// 💰 BALANCE UI
// =============================
function updateBalance(amount) {
  const top = document.getElementById("top-balance");
  const profile = document.getElementById("profile-balance");

  if (top) top.innerText = `БАЛАНС: ${amount} VC`;
  if (profile) profile.innerText = `Баланс: ${amount} VC`;
}

// =============================
// 💳 CREATE DEPOSIT REQUEST
// =============================
document.addEventListener("DOMContentLoaded", () => {
  initTelegram();

  const confirmBtn = document.getElementById("confirm-paid");
  if (!confirmBtn) return;

  confirmBtn.onclick = async () => {
    const amount = +document.getElementById("deposit-amount").value || 0;

    if (amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    const { error } = await supabase
      .from("deposits")
      .insert({
        user_id: USER_ID,
        amount: amount,
        status: "waiting"
      });

    if (error) {
      alert("Ошибка создания заявки");
      console.error(error);
      return;
    }

    alert("✅ Заявка отправлена");
  };
});

// =============================
// 🔔 ЗАГЛУШКИ (будем расширять)
// =============================
// withdraw
// history
// referrals
// promocodes
