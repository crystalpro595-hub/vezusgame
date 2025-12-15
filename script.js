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

const openPopup = (id) => $(id) && ($(id).style.display = "flex");
const closePopup = (id) => $(id) && ($(id).style.display = "none");

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
    amount,
    status: "process" // ⏳ В процессе
  });
}

/***********************
 * DOM READY
 ***********************/
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();

  $("wallet-open").onclick = () => openPopup("popup-wallet");
  $("close-wallet").onclick = () => closePopup("popup-wallet");

  $("open-deposit").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  };
  $("close-deposit").onclick = () => closePopup("popup-deposit");

  $("to-payment").onclick = async () => {
    const amount = Number($("deposit-amount").value);
    if (amount < 100) return alert("Минимум 100 ₽");

    await createDeposit(amount);
    $("pay-amount-text").innerText = amount + " ₽";

    closePopup("popup-deposit");
    openPopup("popup-payment");
  };

  $("close-payment").onclick = () => closePopup("popup-payment");

  /********** Я ОПЛАТИЛ **********/
  $("confirm-paid").onclick = async () => {
    $("confirm-paid").style.pointerEvents = "none";

    const userId = localStorage.getItem("user_id");

    const { data } = await supabase
      .from("deposits")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "process")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      alert("Заявка не найдена");
      $("confirm-paid").style.pointerEvents = "auto";
      return;
    }

    alert("Заявка отправлена. Ожидает проверки ✅");
    closePopup("popup-payment");
  };

  $("open-withdraw").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-withdraw");
  };
  $("close-withdraw").onclick = () => closePopup("popup-withdraw");

  $("open-requests").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-requests");
  };
  $("close-requests").onclick = () => closePopup("popup-requests");

  $("btn-profile").onclick = () => openPopup("popup-profile");
  $("close-profile").onclick = () => closePopup("popup-profile");

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
