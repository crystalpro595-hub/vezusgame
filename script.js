// === УТИЛИТЫ ===
const $ = id => document.getElementById(id);

function openPopup(id) {
    $(id).style.display = "flex";
}

function closePopup(id) {
    $(id).style.display = "none";
}

// === ЖДЁМ DOM ===
document.addEventListener("DOMContentLoaded", () => {

    // --- КОШЕЛЁК ---
    $("wallet-open").onclick = () => openPopup("popup-wallet");
    $("close-wallet").onclick = () => closePopup("popup-wallet");

    // --- ПОПОЛНЕНИЕ ---
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
    $("close-payment").onclick = () => closePopup("popup-payment");

    // --- ВЫВОД ---
    $("open-withdraw").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-withdraw");
    };
    $("close-withdraw").onclick = () => closePopup("popup-withdraw");

    // --- ЗАЯВКИ ---
    $("open-requests").onclick = () => {
        closePopup("popup-wallet");
        openPopup("popup-requests");
    };
    $("close-requests").onclick = () => closePopup("popup-requests");

    // --- ПРОФИЛЬ ---
    $("btn-profile").onclick = () => openPopup("popup-profile");
    $("close-profile").onclick = () => closePopup("popup-profile");

    // --- БОНУСЫ ---
    $("btn-bonus").onclick = () => openPopup("popup-bonus");
    $("close-bonus").onclick = () => closePopup("popup-bonus");

    // --- ПРОМОКОД ---
    $("bonus-promocode").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-promocode");
    };
    $("close-promocode").onclick = () => closePopup("popup-promocode");

    // --- РЕФЕРАЛ ---
    $("bonus-referral").onclick = () => {
        closePopup("popup-bonus");
        openPopup("popup-referral");
    };
    $("close-referral").onclick = () => closePopup("popup-referral");
});
