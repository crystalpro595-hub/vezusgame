document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
  const SUPABASE_KEY = "ВАШ_ANON_KEY"; // оставь свой ключ

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const tg = window.Telegram.WebApp;
  tg.expand();

  // Очищаем кеш схемы, чтобы клиент увидел новые колонки
  localStorage.removeItem("supabase-schema-cache");

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
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name
        })
        .select()
        .single();

      if (error) {
        alert("Ошибка создания пользователя: " + error.message);
        return;
      }

      // Создаём баланс
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

    const { data: wd } = await supabase
      .from("withdrawals")
      .select("amount, requisites, address, status, created_at")
      .eq("user_id", window.USER_ID)
      .order("created_at", { ascending: false });

    if (!wd?.length) {
      list.innerHTML = "<div class='meta'>Операций пока нет</div>";
      return;
    }

    wd.forEach(w => {
      let statusText = "⏳ В ожидании";
      if (w.status === "success") statusText = "✅ Успешно";
      if (w.status === "rejected") statusText = "❌ Отказано";
      if (w.status === "waiting") statusText = "⏳ На рассмотрении";

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
          <span>${statusText}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  document.getElementById("confirm-withdraw").onclick = async () => {
    const amount = parseFloat(document.getElementById("withdraw-amount").value);
    const requisites = document.getElementById("withdraw-wallet").value.trim();
    const address = requisites;

    if (!amount || amount <= 0) {
      alert("Введите сумму");
      return;
    }
    if (!requisites) {
      alert("Введите реквизиты / адрес кошелька");
      return;
    }

    const { error } = await supabase.from("withdrawals").insert({
      user_id: window.USER_ID,
      amount,
      requisites,
      address,
      status: "waiting",
      created_at: new Date().toISOString()
    });

    if (error) {
      alert("Ошибка отправки заявки: " + error.message);
      return;
    }

    document.getElementById("withdraw-amount").value = "";
    document.getElementById("withdraw-wallet").value = "";
    closePopup("popup-withdraw");
    alert("Заявка на вывод отправлена. Ждите подтверждения.");
  };

  // Запуск
  initUser();
});
