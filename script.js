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
// POPUPS
// ===============================
const openPopup = id => document.getElementById(id).style.display = "flex";
const closePopup = id => document.getElementById(id).style.display = "none";

// Кошелёк
wallet-open.onclick = () => openPopup("popup-wallet");
close-wallet.onclick = () => closePopup("popup-wallet");

// Пополнение
open-deposit.onclick = () => {
  closePopup("popup-wallet");
  openPopup("popup-deposit");
};
close-deposit.onclick = () => closePopup("popup-deposit");

// Оплата
close-payment.onclick = () => closePopup("popup-payment");

// Вывод
open-withdraw.onclick = () => {
  closePopup("popup-wallet");
  openPopup("popup-withdraw");
};
close-withdraw.onclick = () => closePopup("popup-withdraw");

// Заявки
open-requests.onclick = () => {
  closePopup("popup-wallet");
  openPopup("popup-requests");
};
close-requests.onclick = () => closePopup("popup-requests");

// Профиль
btn-profile.onclick = () => openPopup("popup-profile");
close-profile.onclick = () => closePopup("popup-profile");

// Бонусы
btn-bonus.onclick = () => openPopup("popup-bonus");
close-bonus.onclick = () => closePopup("popup-bonus");

// Промокод
bonus-promocode.onclick = () => {
  closePopup("popup-bonus");
  openPopup("popup-promocode");
};
close-promocode.onclick = () => closePopup("popup-promocode");

// Реферал
bonus-referral.onclick = () => {
  closePopup("popup-bonus");
  openPopup("popup-referral");
};
close-referral.onclick = () => closePopup("popup-referral");
  // ===============================
  // DEPOSIT
  // ===============================
  const depositInput = document.getElementById("deposit-amount");
  const vcEstimate = document.getElementById("vc-estimate");

  depositInput.addEventListener("input", () => {
    const value = parseInt(depositInput.value || 0);
    vcEstimate.innerText = `${value} VC`;
  });

  document.getElementById("to-payment").onclick = () => {
    const amount = parseInt(depositInput.value);

    if (!amount || amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }

    document.getElementById("pay-amount-text").innerText = `${amount} ₽`;
    openPopup("popup-payment");
  };

  document.getElementById("confirm-paid").onclick = async () => {
    const amount = parseInt(depositInput.value);

    if (!amount || amount < 100) {
      alert("Ошибка суммы");
      return;
    }

    await supabase.from("deposits").insert({
      user_id: window.USER_ID,
      amount_rub: amount,
      amount_vc: amount,
      status: "waiting"
    });

    closePopup("popup-payment");
    closePopup("popup-deposit");

    alert("Заявка отправлена. Ожидайте подтверждения.");
  };

  // ===============================
  // START
  // ===============================
  initUser();

});
