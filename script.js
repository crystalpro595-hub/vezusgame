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

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return;

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
    status: "pending"
  });
}

/***********************
 * DOM READY
 ***********************/
document.addEventListener("DOMContentLoaded", () => {

  loadProfile();

  /* === КОШЕЛЁК === */
  $("wallet-open")?.addEventListener("click", () => openPopup("popup-wallet"));
  $("close-wallet")?.addEventListener("click", () => closePopup("popup-wallet"));

  /* === ПОПОЛНЕНИЕ === */
  $("open-deposit")?.addEventListener("click", () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  });

  $("close-deposit")?.addEventListener("click", () =>
    closePopup("popup-deposit")
  );

  /* === К ОПЛАТЕ === */
  $("to-payment")?.addEventListener("click", async () => {
    const amount = Number($("deposit-amount")?.value);

    if (!amount || amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    await createDeposit(amount);

    $("pay-amount-text").innerText = amount + " ₽";

    closePopup("popup-deposit");
    openPopup("popup-payment");
  });

  $("close-payment")?.addEventListener("click", () =>
    closePopup("popup-payment")
  );

  /* === КНОПКА Я ОПЛАТИЛ (ГЛАВНОЕ) === */
  $("confirm-paid")?.addEventListener("click", async () => {
    console.log("Нажата кнопка Я оплатил");

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Пользователь не найден");
      return;
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
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

  /* === ВЫВОД === */
  $("open-withdraw")?.addEventListener("click", () => {
    closePopup("popup-wallet");
    openPopup("popup-withdraw");
  });

  $("close-withdraw")?.addEventListener("click", () =>
    closePopup("popup-withdraw")
  );

  /* === ЗАЯВКИ === */
  $("open-requests")?.addEventListener("click", () => {
    closePopup("popup-wallet");
    openPopup("popup-requests");
  });

  $("close-requests")?.addEventListener("click", () =>
    closePopup("popup-requests")
  );

  /* === ПРОФИЛЬ === */
  $("btn-profile")?.addEventListener("click", () =>
    openPopup("popup-profile")
  );
  $("close-profile")?.addEventListener("click", () =>
    closePopup("popup-profile")
  );

  /* === БОНУСЫ === */
  $("btn-bonus")?.addEventListener("click", () =>
    openPopup("popup-bonus")
  );
  $("close-bonus")?.addEventListener("click", () =>
    closePopup("popup-bonus")
  );

  $("bonus-promocode")?.addEventListener("click", () => {
    closePopup("popup-bonus");
    openPopup("popup-promocode");
  });

  $("close-promocode")?.addEventListener("click", () =>
    closePopup("popup-promocode")
  );

  $("bonus-referral")?.addEventListener("click", () => {
    closePopup("popup-bonus");
    openPopup("popup-referral");
  });

  $("close-referral")?.addEventListener("click", () =>
    closePopup("popup-referral")
  );
});
