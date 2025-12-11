/* === инициализация Supabase (если нужно) === */
const supabaseUrl = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const supabaseKey = "PUBLIC-KEY-HERE"; // вставь свой public anon key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/* === ФУНКЦИИ ПОПАПОВ === */
function openPopup(id) {
    document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
    document.getElementById(id).style.display = "none";
}

/* === ЖДЁМ ПОЛНУЮ ЗАГРУЗКУ DOM === */
document.addEventListener("DOMContentLoaded", () => {

    /* === КОШЕЛЁК === */
    const walletBtn = document.getElementById("wallet-open");
    const closeWallet = document.getElementById("close-wallet");
    walletBtn.onclick = () => openPopup("popup-wallet");
    closeWallet.onclick = () => closePopup("popup-wallet");

    /* === ПОПОЛНЕНИЕ === */
    document.getElementById("open-deposit").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-deposit");
    };
    document.getElementById("close-deposit").onclick = () =>
        closePopup("popup-deposit");

    /* === ОПЛАТА === */
    document.getElementById("to-payment").onclick = () => {
        const amount = document.getElementById("deposit-amount").value;
        if (!amount || amount < 100) return alert("Минимум 100 ₽");

        document.getElementById("pay-amount-text").textContent = amount + " ₽";

        closePopup("popup-deposit");
        openPopup("popup-payment");
    };
    document.getElementById("close-payment").onclick = () =>
        closePopup("popup-payment");

    /* === ВЫВОД === */
    document.getElementById("open-withdraw").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-withdraw");
    };
    document.getElementById("close-withdraw").onclick = () =>
        closePopup("popup-withdraw");

    /* === ЗАЯВКИ === */
    document.getElementById("open-requests").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-requests");
    };
    document.getElementById("close-requests").onclick = () =>
        closePopup("popup-requests");

    /* === ПРОФИЛЬ === */
    document.getElementById("btn-profile").onclick = () =>
        openPopup("popup-profile");
    document.getElementById("close-profile").onclick = () =>
        closePopup("popup-profile");

    /* === БОНУСЫ === */
    document.getElementById("btn-bonus").onclick = () =>
        openPopup("popup-bonus");
    document.getElementById("close-bonus").onclick = () =>
        closePopup("popup-bonus");

    /* === ПРОМОКОД === */
    document.getElementById("bonus-promocode").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-promocode");
    };
    document.getElementById("close-promocode").onclick = () =>
        closePopup("popup-promocode");

    /* === РЕФЕРАЛКА === */
    document.getElementById("bonus-referral").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-referral");
    };
    document.getElementById("close-referral").onclick = () =>
        closePopup("popup-referral");
});
