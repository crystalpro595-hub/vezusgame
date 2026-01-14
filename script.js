document.addEventListener("DOMContentLoaded", () => {

  console.log("SCRIPT LOADED");

  /* ================= CONFIG ================= */

  const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const tg = window.Telegram?.WebApp;
  if (!tg?.initDataUnsafe?.user) {
    alert("Открой через Telegram");
    return;
  }

  tg.expand();
  const tgUser = tg.initDataUnsafe.user;

  /* ================= HELPERS ================= */

  const $ = id => document.getElementById(id);

  const onClick = (id, fn) => {
    const el = $(id);
    if (el) el.onclick = fn;
  };

  const openPopup = id => {
    const el = $(id);
    if (el) el.style.display = "flex";
  };

  const closePopup = id => {
    const el = $(id);
    if (el) el.style.display = "none";
  };

  /* ================= USER INIT ================= */

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

      if (error || !newUser) {
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

    const name =
      tgUser.first_name +
      (tgUser.last_name ? " " + tgUser.last_name : "");

    if ($("profile-user")) {
      $("profile-user").innerText = `👤 ${name} | TG ID: ${tgUser.id}`;
    }

    loadBalance();
  }

  /* ================= BALANCE ================= */

  async function loadBalance() {
    const { data } = await supabase
      .from("balances")
      .select("balance")
      .eq("user_id", window.USER_ID)
      .single();

    const balance = data?.balance ?? 0;

    if ($("top-balance"))
      $("top-balance").innerText = `БАЛАНС: ${balance} VC`;

    if ($("profile-balance"))
      $("profile-balance").innerText = `Баланс: ${balance} VC`;

    if ($("wallet-balance-live"))
      $("wallet-balance-live").innerText = `${balance} VC`;

    if ($("game-balance"))
      $("game-balance").innerText = `${balance} VC`;
  }

  /* ================= CONVERT ₽ → VC ================= */

  if ($("deposit-amount") && $("vc-estimate")) {
    $("deposit-amount").addEventListener("input", () => {
      const rub = parseFloat($("deposit-amount").value) || 0;
      $("vc-estimate").innerText = `${Math.floor(rub)} VC`;
    });
  }

  /* ================= POPUPS ================= */

  onClick("wallet-open", () => openPopup("popup-wallet"));
  onClick("close-wallet", () => closePopup("popup-wallet"));

  onClick("open-deposit", () => openPopup("popup-deposit"));
  onClick("close-deposit", () => closePopup("popup-deposit"));
  onClick("close-payment", () => closePopup("popup-payment"));

  onClick("open-withdraw", () => openPopup("popup-withdraw"));
  onClick("close-withdraw", () => closePopup("popup-withdraw"));

  onClick("btn-profile", () => {
    openPopup("popup-profile");
    loadHistory();
  });
  onClick("close-profile", () => closePopup("popup-profile"));

  onClick("btn-bonus", () => openPopup("popup-bonus"));
  onClick("close-bonus", () => closePopup("popup-bonus"));

  onClick("btn-game", () => {
    openPopup("popup-game");
    loadBalance();
  });
  onClick("close-game", () => closePopup("popup-game"));

  /* ================= HISTORY ================= */

  async function loadHistory() {
    const list = $("history-list");
    if (!list) return;

    list.innerHTML = "";

    const { data: dep } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", window.USER_ID);

    const { data: wd } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", window.USER_ID);

    const history = [];

    dep?.forEach(d =>
      history.push({
        type: "deposit",
        amount: d.amount,
        status: d.status,
        time: new Date(d.created_at).getTime()
      })
    );

    wd?.forEach(w =>
      history.push({
        type: "withdraw",
        id: w.id,
        amount: w.amount,
        address: w.address,
        status: w.status,
        time: new Date(w.created_at).getTime()
      })
    );

    history.sort((a, b) => b.time - a.time);

    if (!history.length) {
      list.innerHTML = "<div class='meta'>Операций пока нет</div>";
      return;
    }

    history.forEach(item => {
      const el = document.createElement("div");
      el.className = "item";

      el.innerHTML = `
        <div>
          <b>${item.type === "deposit" ? "➕ Пополнение" : "💸 Вывод"}</b>
          <div class="meta">${new Date(item.time).toLocaleString()}</div>
          ${item.address ? `<div class="meta">${item.address}</div>` : ""}
        </div>
        <div style="text-align:right">
          <b>${item.amount} VC</b><br>
          <span>${item.status}</span>
        </div>
      `;

      list.appendChild(el);
    });
  }

  /* ================= GAME ================= */

  onClick("open-dice", async () => {
    const bet = prompt("Введите ставку (VC)");
    const amount = parseInt(bet);
    if (!amount || amount <= 0) return;

    const { data: bal } = await supabase
      .from("balances")
      .select("balance")
      .eq("user_id", window.USER_ID)
      .single();

    if (!bal || bal.balance < amount) {
      alert("Недостаточно средств");
      return;
    }

    await supabase
      .from("balances")
      .update({ balance: bal.balance - amount })
      .eq("user_id", window.USER_ID);

    if (Math.random() < 0.5) {
      await supabase
        .from("balances")
        .update({ balance: bal.balance + amount * 2 })
        .eq("user_id", window.USER_ID);

      alert("🎉 Победа!");
    } else {
      alert("😢 Проигрыш");
    }

    loadBalance();
  });

  /* ================= START ================= */

  initUser();
});
