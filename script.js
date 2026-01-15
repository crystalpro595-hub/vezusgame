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

  /* ================= INIT USER ================= */

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

      if (!newUser) {
        alert("Ошибка создания пользователя");
        return;
      }

      await supabase.from("balances").insert({
        user_id: newUser.id,
        balance: 0
      });

      user = newUser;
    }

    window.USER_ID = user.id;
    loadBalance();

    const name = `${tgUser.first_name}${tgUser.last_name ? " " + tgUser.last_name : ""}`;
    document.getElementById("profile-user").innerText =
      `👤 ${name} | TG ID: ${tgUser.id}`;
  }

  /* ===== КОНВЕРТАЦИЯ ₽ → VC ===== */
const depositInput = document.getElementById("deposit-amount");
const vcEstimate = document.getElementById("vc-estimate");

if (depositInput && vcEstimate) {
  depositInput.addEventListener("input", () => {
    const rub = parseFloat(depositInput.value) || 0;

    // КУРС: 1 ₽ = 1 VC
    const vc = Math.floor(rub);

    vcEstimate.innerText = `${vc} VC`;
  });
}
  
  /* ================= BALANCE ================= */

  async function loadBalance() {
    const { data } = await supabase
      .from("balances")
      .select("balance")
      .eq("user_id", window.USER_ID)
      .single();

    const balance = data?.balance ?? 0;
    document.getElementById("top-balance").innerText = `БАЛАНС: ${balance} VC`;
    document.getElementById("profile-balance").innerText = `Баланс: ${balance} VC`;
    document.getElementById("wallet-balance-live").innerText = `${balance} VC`;
  }

  /* ================= POPUPS ================= */

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
// открыть бонусы
document.getElementById("btn-bonus").onclick = () => {
  openPopup("popup-bonus");
};

// закрыть бонусы
document.getElementById("close-bonus").onclick = () => {
  closePopup("popup-bonus");
};

// временные действия
document.getElementById("open-promo").onclick = () => {
  alert("🎟 Скоро будет промокод");
};

document.getElementById("open-referral").onclick = () => {
  alert("👥 Скоро будет реферальная система");
};

document.getElementById("open-giveaway").onclick = () => {
  alert("🎁 Скоро будут розыгрыши");
};
  /* ================= HISTORY ================= */

  async function loadHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    const { data: dep } = await supabase
      .from("deposits")
      .select("amount, status, created_at")
      .eq("user_id", window.USER_ID)
      .order("created_at", { ascending: false });

    const { data: wd } = await supabase
      .from("withdrawals")
      .select("id, amount, address, status, created_at")
      .eq("user_id", window.USER_ID)
      .order("created_at", { ascending: false });

    if (!dep?.length && !wd?.length) {
      list.innerHTML = "<div class='meta'>Операций пока нет</div>";
      return;
    }

    const history = [];

    // депозиты
dep?.forEach(d => {
  history.push({
    type: "deposit",
    amount: d.amount,
    status: d.status,
    created_at: new Date(d.created_at).getTime()
  });
});

// выводы
wd?.forEach(w => {
  history.push({
    type: "withdraw",
    id: w.id,
    amount: w.amount,
    address: w.address,
    status: w.status,
    created_at: new Date(w.created_at).getTime()
  });
});

// сортировка
history.sort((a, b) => b.created_at - a.created_at);

// рендер
history.forEach(item => {
  if (item.type === "deposit") {
    const s =
      item.status === "approved" ? "✅ Успешно" :
      item.status === "rejected" ? "❌ Отказано" :
      "⏳ В ожидании";

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <b>➕ Пополнение</b>
        <div class="meta">${new Date(item.created_at).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <b>${item.amount} VC</b><br>
        <span>${s}</span>
      </div>`;
    list.appendChild(el);
  }

  if (item.type === "withdraw") {
    const s =
      item.status === "approved" ? "✅ Успешно" :
      item.status === "rejected" ? "❌ Отказано" :
      item.status === "cancelled" ? "❌ Отменено" :
      "⏳ В ожидании";

    const canCancel =
      item.status === "pending"
        ? `<button class="cancel-btn" data-id="${item.id}" data-amount="${item.amount}">Отменить</button>`
        : "";

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <b>💸 Вывод</b>
        <div class="meta">${new Date(item.created_at).toLocaleString()}</div>
        <div class="meta">Реквизиты: ${item.address}</div>
        ${canCancel}
      </div>
      <div style="text-align:right">
        <b>${item.amount} VC</b><br>
        <span>${s}</span>
      </div>`;
    list.appendChild(el);
  }
});

// навешиваем кнопки отмены
document.querySelectorAll(".cancel-btn").forEach(btn => {
  btn.onclick = () => {
    cancelWithdrawal(btn.dataset.id, parseFloat(btn.dataset.amount));
  };
});

    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.onclick = () => {
        cancelWithdrawal(btn.dataset.id, parseFloat(btn.dataset.amount));
      };
    });
  }

  /* ================= CANCEL WITHDRAW ================= */

  async function cancelWithdrawal(id, amount) {
    if (!confirm("Отменить заявку на вывод?")) return;

    const { error } = await supabase
      .from("withdrawals")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", window.USER_ID)
      .eq("status", "pending");

    if (error) {
      alert("Ошибка отмены");
      return;
    }

    const { data: bal } = await supabase
      .from("balances")
      .select("balance")
      .eq("user_id", window.USER_ID)
      .single();

    await supabase
      .from("balances")
      .update({ balance: bal.balance + amount })
      .eq("user_id", window.USER_ID);

    loadBalance();
    loadHistory();
    alert("Заявка отменена, средства возвращены");
  }

  /* ================= DEPOSIT ================= */

  document.getElementById("to-payment").onclick = () => {
    const amount = parseInt(document.getElementById("deposit-amount").value);
    if (!amount || amount < 100) return alert("Минимум 100 ₽");
    document.getElementById("pay-amount-text").innerText = `${amount} ₽`;
    openPopup("popup-payment");
  };

  document.getElementById("confirm-paid").onclick = async () => {
  const amount = parseInt(document.getElementById("deposit-amount").value);

  if (!amount || amount < 100) {
    alert("Минимум 100 ₽");
    return;
  }

  const { error } = await supabase.from("deposits").insert({
    user_id: window.USER_ID,
    amount: amount,
    status: "pending"
  });

  if (error) {
    alert(error.message);
    return;
  }

  // закрываем попапы
  closePopup("popup-payment");
  closePopup("popup-deposit");

  // показываем анимацию успеха
  openPopup("popup-success");

  setTimeout(() => {
    closePopup("popup-success");
  }, 2500);
};

  /* ================= WITHDRAW ================= */

  document.getElementById("confirm-withdraw").onclick = async () => {
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const requisites = document.getElementById("withdraw-wallet").value.trim();

  if (!amount || amount <= 0) {
    alert("Введите сумму");
    return;
  }

  if (!requisites) {
    alert("Введите реквизиты");
    return;
  }

  const { data: bal } = await supabase
    .from("balances")
    .select("balance")
    .eq("user_id", window.USER_ID)
    .single();

  if (!bal || bal.balance < amount) {
    alert("Недостаточно средств");
    return;
  }

  // списываем баланс
  await supabase
    .from("balances")
    .update({ balance: bal.balance - amount })
    .eq("user_id", window.USER_ID);

  // создаём заявку
  const { error } = await supabase.from("withdrawals").insert({
    user_id: window.USER_ID,
    amount: amount,
    address: requisites,
    status: "pending"
  });

  if (error) {
    alert(error.message);
    return;
  }

  // закрываем попап вывода
  closePopup("popup-withdraw");

  // обновляем баланс
  loadBalance();

  // показываем красивое подтверждение
  openPopup("popup-success");

  setTimeout(() => {
    closePopup("popup-success");
  }, 2500);
};

  initUser();

  /* ================= PROMO CODE ================= */

  const promoBtn = document.getElementById("promo-apply");
  const promoInput = document.getElementById("promo-input");

  if (promoBtn && promoInput) {
    promoBtn.onclick = async () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return alert("Введите промокод");

      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .single();

      if (!promo) {
        alert("❌ Промокод недействителен");
        return;
      }

      const { data: used } = await supabase
        .from("promo_uses")
        .select("id")
        .eq("user_id", window.USER_ID)
        .eq("promo_id", promo.id)
        .single();

      if (used) {
        alert("⚠️ Вы уже активировали этот промокод");
        return;
      }

      const { data: bal } = await supabase
        .from("balances")
        .select("balance")
        .eq("user_id", window.USER_ID)
        .single();

      await supabase
        .from("balances")
        .update({ balance: bal.balance + promo.reward })
        .eq("user_id", window.USER_ID);

      await supabase.from("promo_uses").insert({
        user_id: window.USER_ID,
        promo_id: promo.id
      });

      loadBalance();
      promoInput.value = "";
      alert(`✅ Промокод активирован! +${promo.reward} VC`);
    };
  }
