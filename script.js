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
 * ВСПОМОГАТЕЛЬНЫЕ
 ***********************/
function $(id) {
  return document.getElementById(id);
}

function openPopup(id) {
  const el = $(id);
  if (el) el.style.display = "flex";
}

function closePopup(id) {
  const el = $(id);
  if (el) el.style.display = "none";
}

function bind(id, fn) {
  const el = $(id);
  if (el) el.onclick = fn;
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
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  if ($("top-balance"))
    $("top-balance").innerText = `БАЛАНС: ${data.balance} VC`;

  if ($("profile-balance"))
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
    status: "pending",
    applied: false
  });
}

/***********************
 * POPUPS
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  // Кошелёк
  bind("wallet-open", () => openPopup("popup-wallet"));
  bind("close-wallet", () => closePopup("popup-wallet"));

  // Пополнение
  bind("open-deposit", () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  });
  bind("close-deposit", () => closePopup("popup-deposit"));

  // К оплате
  bind("to-payment", async () => {
    const input = $("deposit-amount");
    if (!input || input.value < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    await createDeposit(Number(input.value));
    if ($("pay-amount-text"))
      $("pay-amount-text").innerText = input.value + " ₽";

    closePopup("popup-deposit");
    openPopup("popup-payment");
  });

  bind("close-payment", () => closePopup("popup-payment"));

  // Вывод
  bind("open-withdraw", () => {
    closePopup("popup-wallet");
    openPopup("popup-withdraw");
  });
  bind("close-withdraw", () => closePopup("popup-withdraw"));

  // Заявки
  bind("open-requests", () => {
    closePopup("popup-wallet");
    openPopup("popup-requests");
  });
  bind("close-requests", () => closePopup("popup-requests"));

  // Профиль
  bind("btn-profile", () => openPopup("popup-profile"));
  bind("close-profile", () => closePopup("popup-profile"));

  // Бонусы
  bind("btn-bonus", () => openPopup("popup-bonus"));
  bind("close-bonus", () => closePopup("popup-bonus"));

  // Промокод
  bind("bonus-promocode", () => {
    closePopup("popup-bonus");
    openPopup("popup-promocode");
  });
  bind("close-promocode", () => closePopup("popup-promocode"));

  // Рефералка
  bind("bonus-referral", () => {
    closePopup("popup-bonus");
    openPopup("popup-referral");
  });
  bind("close-referral", () => closePopup("popup-referral"));
});

// ===== КНОПКА "Я ОПЛАТИЛ" =====
bind("confirm-paid", async () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const { data } = await supabase
    .from("deposits")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    alert("Заявка не найдена");
    return;
  }

  await supabase
    .from("deposits")
    .update({ status: "waiting" })
    .eq("id", data.id);

  alert("Заявка отправлена на проверку");
  closePopup("popup-payment");
});
