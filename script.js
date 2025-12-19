// ==================
// SUPABASE
// ==================
const SUPABASE_URL = "https://ТВОЙ_PROJECT_ID.supabase.co";
const SUPABASE_KEY = "ТВОЙ_PUBLIC_ANON_KEY";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==================
// TELEGRAM USER
// ==================
let tgUser = null;
let userId = null;

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    tgUser = Telegram.WebApp.initDataUnsafe?.user || null;
}

if (!tgUser) {
    alert("Открой сайт через Telegram");
    throw new Error("No Telegram user");
}

userId = tgUser.id.toString();

// ==================
// DOM UTILS
// ==================
const $ = id => document.getElementById(id);
const openPopup = id => $(id).style.display = "flex";
const closePopup = id => $(id).style.display = "none";

// ==================
// USER INIT
// ==================
async function initUser() {
    let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!profile) {
        await supabase.from("profiles").insert({
            user_id: userId,
            username: tgUser.username || null,
            first_name: tgUser.first_name || null,
            balance: 0
        });

        profile = { balance: 0 };
    }

    updateBalance(profile.balance);
}

function updateBalance(balance) {
    $("top-balance").innerText = `БАЛАНС: ${balance} VC`;
    $("profile-balance").innerText = `Баланс: ${balance} VC`;
}

// ==================
// DOM READY
// ==================
document.addEventListener("DOMContentLoaded", async () => {

    await initUser();

    // КОШЕЛЁК
    $("wallet-open").onclick = () => openPopup("popup-wallet");
    $("close-wallet").onclick = () => closePopup("popup-wallet");

    // ПОПОЛНЕНИЕ
    $("open-deposit").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-deposit");
    };
    $("close-deposit").onclick = () => closePopup("popup-deposit");

    $("to-payment").onclick = () => {
        const amount = Number($("deposit-amount").value);
        if (amount < 100) return alert("Минимум 100 ₽");

        $("pay-amount-text").innerText = amount + " ₽";
        closePopup("popup-deposit");
        openPopup("popup-payment");
    };

    $("close-payment").onclick = () => closePopup("popup-payment");

    // ПОДТВЕРЖДЕНИЕ ОПЛАТЫ
    $("confirm-paid").onclick = async () => {
        const amount = Number($("deposit-amount").value);

        await supabase.from("deposits").insert({
            user_id: userId,
            amount: amount,
            status: "waiting"
        });

        alert("Заявка отправлена");
        closePopup("popup-payment");
    };

    // ВЫВОД
    $("open-withdraw").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-withdraw");
    };
    $("close-withdraw").onclick = () => closePopup("popup-withdraw");

    // ЗАЯВКИ
    $("open-requests").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-requests");
    };
    $("close-requests").onclick = () => closePopup("popup-requests");

    // ПРОФИЛЬ
    $("btn-profile").onclick = () => openPopup("popup-profile");
    $("close-profile").onclick = () => closePopup("popup-profile");

    // БОНУСЫ
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
