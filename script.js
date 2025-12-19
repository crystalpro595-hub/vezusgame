/***********************
 * НАСТРОЙКИ
 ***********************/
const SUPABASE_URL = "https://crystalpro595-hub.supabase.co";
const SUPABASE_KEY = "PASTE_YOUR_PUBLIC_ANON_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/***********************
 * УТИЛИТЫ (ТВОИ, НЕ ТРОГАЛ)
 ***********************/
const $ = id => document.getElementById(id);

function openPopup(id) {
    $(id).style.display = "flex";
}
function closePopup(id) {
    $(id).style.display = "none";
}

/***********************
 * TELEGRAM USER
 ***********************/
let tgUser = null;
let currentUserId = null;
let balance = 0;

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    tgUser = Telegram.WebApp.initDataUnsafe?.user || null;
}

/***********************
 * ЗАГРУЗКА / СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
 ***********************/
async function initUser() {
    if (!tgUser) {
        console.warn("Открыто не из Telegram");
        return;
    }

    // 1. Проверяем пользователя
    let { data: user } = await supabase
        .from("players")
        .select("*")
        .eq("telegram_id", tgUser.id)
        .single();

    // 2. Если нет — создаём
    if (!user) {
        const res = await supabase.from("players").insert({
            telegram_id: tgUser.id,
            username: tgUser.username || "",
            first_name: tgUser.first_name || "",
            balance: 0
        }).select().single();
        user = res.data;
    }

    currentUserId = user.id;
    balance = user.balance || 0;
    updateBalanceUI();
    loadHistory();
}

/***********************
 * UI
 ***********************/
function updateBalanceUI() {
    $("top-balance").innerText = `БАЛАНС: ${balance} VC`;
    if ($("profile-balance")) {
        $("profile-balance").innerText = `Баланс: ${balance} VC`;
    }
}

/***********************
 * ПОПОЛНЕНИЕ (БЕЗ ДВОЙНОГО НАЧИСЛЕНИЯ)
 ***********************/
let depositLocked = false;

async function createDeposit(amount) {
    if (depositLocked) return;
    depositLocked = true;

    await supabase.from("deposits").insert({
        user_id: currentUserId,
        amount: amount,
        status: "pending"
    });

    depositLocked = false;
}

/***********************
 * ВЫВОД
 ***********************/
async function createWithdraw(amount, bank, phone) {
    await supabase.from("withdrawals").insert({
        user_id: currentUserId,
        amount: amount,
        bank,
        phone,
        status: "pending"
    });
}

/***********************
 * ИСТОРИЯ
 ***********************/
async function loadHistory() {
    const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

    const list = $("history-list");
    list.innerHTML = "";

    (data || []).forEach(t => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <div>${t.type}</div>
            <div class="meta">${t.amount} VC</div>
        `;
        list.appendChild(div);
    });
}

/***********************
 * DOM READY — ТВОЙ КОД + ДОБАВКИ
 ***********************/
document.addEventListener("DOMContentLoaded", () => {

    // === ТВОИ ОБРАБОТЧИКИ (НЕ ТРОГАЛ) ===
    $("wallet-open").onclick = () => openPopup("popup-wallet");
    $("close-wallet").onclick = () => closePopup("popup-wallet");

    $("open-deposit").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-deposit");
    };
    $("close-deposit").onclick = () => closePopup("popup-deposit");

    $("to-payment").onclick = () => {
        const amount = +$("deposit-amount").value || 0;
        $("pay-amount-text").innerText = amount + " ₽";
        closePopup("popup-deposit");
        openPopup("popup-payment");
    };

    $("confirm-paid").onclick = async () => {
        const amount = +$("deposit-amount").value || 0;
        if (amount >= 100) {
            await createDeposit(amount);
            closePopup("popup-payment");
            alert("Заявка на пополнение отправлена");
        }
    };

    $("close-payment").onclick = () => closePopup("popup-payment");

    $("open-withdraw").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-withdraw");
    };
    $("close-withdraw").onclick = () => closePopup("popup-withdraw");

    $("submit-withdraw").onclick = async () => {
        const amount = +$("withdraw-amount").value || 0;
        const bank = $("withdraw-bank").value;
        const phone = $("withdraw-phone").value;
        if (amount >= 500) {
            await createWithdraw(amount, bank, phone);
            closePopup("popup-withdraw");
            alert("Заявка на вывод отправлена");
        }
    };

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

    // === INIT ===
    initUser();
});
