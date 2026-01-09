// Очищаем кеш схемы, чтобы SDK увидел новые колонки
localStorage.removeItem("supabase-schema-cache");

document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const tg = window.Telegram.WebApp;
  tg.expand();

  if (!tg.initDataUnsafe?.user) {
    alert("Открой через Telegram");
    return;
  }

  const tgUser = tg.initDataUnsafe.user;

  async function initUser() {
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", tgUser.id)
      .single();

    if (!user) {
      const { data: newUser } = await supabase
        .from("users")
        .insert({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name
        })
        .select()
        .single();

      if (!newUser) return alert("Ошибка создания пользователя");

      await supabase.from("balances").insert({ user_id: newUser.id, balance: 0 });
      user = newUser;
    }

    window.USER_ID = user.id;
    loadBalance();

    const name = `${tgUser.first_name}${tgUser.last_name ? " " + tgUser.last_name : ""}`;
    document.getElementById("profile-user").innerText = `👤 ${name} | TG ID: ${tgUser.id}`;
  }

  async function loadBalance() {
    const { data } = await supabase
      .from("balances")
      .select("balance")
      .eq("user_id", window.USER_ID)
      .single();

    const balance = data?.balance ?? 0;
    document.getElementById("top-balance").innerText = `БАЛАНС: ${balance} VC`;
    document.getElementById("profile-balance").innerText = `Баланс: ${balance} VC`;
  }

  const openPopup = id => document.getElementById(id).style.display = "flex";
  const closePopup = id => document.getElementById(id).style.display = "none";

  document.getElementById("wallet-open").onclick = () => openPopup("popup-wallet");
  document.getElementById("close-wallet").onclick = () => closePopup("popup-wallet");

  document.getElementById("open-deposit").onclick = () => openPopup("popup-deposit");
  document.getElementById("close-deposit").onclick = () => closePopup("popup-deposit");
  document.getElementById("close-payment").onclick = () => closePopup("popup-payment");

  document.getElementById("open-withdraw").onclick = () => openPopup("popup-withdraw");
  document.getElementById("close-withdraw").onclick = () => closePopup("popup-withdraw");

  document.getElementById("btn-profile").onclick = () => {
    openPopup("popup-profile");
    loadHistory();
  };
  document.getElementById("close-profile").onclick = () => closePopup("popup-profile");

  async function loadHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    const { data: dep } = await supabase
      .from("deposits")
      .select("amount_vc, status, created_at")
      .eq("user_id", window.USER_ID)
      .order("created_at", { ascending: false });

    const { data: wd } = await supabase
      .from("withdrawals")
      .select("amount, requisites, address, status, created_at")
      .eq("user_id", window.USER_ID)
      .order("created_at", { ascending: false });

    if (!dep?.length && !wd?.length) {
      list.innerHTML = "<div class='meta'>Операций пока нет</div>";
      return;
    }

    dep?.forEach(d => {
      const s = d.status === "success" ? "✅ Успешно" :
                d.status === "rejected" ? "❌ Отказано" : "⏳ В ожидании";

      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div>
          <b>➕ Пополнение</b>
          <div class="meta">${new Date(d.created_at).toLocaleString()}</div>
        </div>
        <div style="text-align:right">
          <b>${d.amount_vc} VC</b><br>
          <span>${s}</span>
        </div>`;
      list.appendChild(item);
    });

    wd?.forEach(w => {
      const s = w.status === "success" ? "✅ Успешно" :
                w.status === "rejected" ? "❌ Отказано" : "⏳ В ожидании";

      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div>
          <b>💸 Вывод</b>
          <div class="meta">${new Date(w.created_at).toLocaleString()}</div>
          <div class="meta">Кошелёк: ${w.address}</div>
          <div class="meta">Реквизиты: ${w.requisites}</div>
        </div>
        <div style="text-align:right">
          <b>${w.amount} VC</b><br>
          <span>${s}</span>
        </div>`;
      list.appendChild(item);
    });
  }

  document.getElementById("to-payment").onclick = () => {
    const amount = parseInt(document.getElementById("deposit-amount").value);
    if (!amount || amount < 100) return alert("Минимум 100 ₽");

    document.getElementById("pay-amount-text").innerText = `${amount} ₽`;
    openPopup("popup-payment");
  };

  document.getElementById("confirm-paid").onclick = async () => {
    const amount = parseInt(document.getElementById("deposit-amount").value);

    const { error } = await supabase.from("deposits").insert({
      user_id: window.USER_ID,
      amount_vc: amount,
      status: "waiting",
      created_at: new Date().toISOString()
    });

    if (error) return alert("Ошибка: " + error.message);

    closePopup("popup-payment");
    closePopup("popup-deposit");
    alert("Заявка отправлена. Ждите подтверждения.");
  };

  document.getElementById("confirm-withdraw").onclick = async () => {
    const amount = parseFloat(document.getElementById("withdraw-amount").value);
    const requisites = document.getElementById("withdraw-wallet").value.trim();

    if (!amount || amount <= 0) return alert("Введите сумму");
    if (!requisites) return alert("Введите реквизиты");

    const { error } = await supabase.from("withdrawals").insert({
      user_id: window.USER_ID,
      amount,
      requisites,
      address: requisites,
      status: "waiting",
      created_at: new Date().toISOString()
    });

    if (error) return alert("Ошибка: " + error.message);

    document.getElementById("withdraw-amount").value = "";
    document.getElementById("withdraw-wallet").value = "";
    closePopup("popup-withdraw");
    alert("Заявка на вывод отправлена");
  };

  initUser();
});
