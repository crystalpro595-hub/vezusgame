<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ================= USER ================= */
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

/* ================= APPLY DEPOSITS ================= */
async function applyConfirmedDeposits() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const { data: deposits, error } = await supabase
    .from("deposits")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .eq("applied", false);

  if (error || !deposits || deposits.length === 0) return;

  let total = 0;
  deposits.forEach(d => total += d.amount);

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (!profile) return;

  const newBalance = profile.balance + total;

  await supabase
    .from("profiles")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  const ids = deposits.map(d => d.id);
  await supabase
    .from("deposits")
    .update({ applied: true })
    .in("id", ids);
}

/* ================= LOAD PROFILE ================= */
async function loadProfile() {
  const userId = await getOrCreateUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return;

  document.getElementById("top-balance").innerText =
    "БАЛАНС: " + data.balance + " VC";

  document.getElementById("profile-balance").innerText =
    "Баланс: " + data.balance + " VC";
}

/* ================= POPUPS ================= */
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

/* ================= DOM ================= */
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("wallet-open").onclick = () =>
    openPopup("popup-wallet");
  document.getElementById("close-wallet").onclick = () =>
    closePopup("popup-wallet");

  document.getElementById("open-deposit").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-deposit");
  };
  document.getElementById("close-deposit").onclick = () =>
    closePopup("popup-deposit");

  document.getElementById("to-payment").onclick = () => {
    const amount = document.getElementById("deposit-amount").value;
    if (!amount || amount < 100) {
      alert("Минимум 100 ₽");
      return;
    }
    document.getElementById("pay-amount-text").innerText = amount + " ₽";
    closePopup("popup-deposit");
    openPopup("popup-payment");
  };
  document.getElementById("close-payment").onclick = () =>
    closePopup("popup-payment");

  document.getElementById("open-withdraw").onclick = () => {
    closePopup("popup-wallet");
    openPopup("popup-withdraw");
  };
  document.getElementById("close-withdraw").onclick = () =>
    closePopup("popup-withdraw");

  document.getElementById("btn-profile").onclick = () =>
    openPopup("popup-profile");
  document.getElementById("close-profile").onclick = () =>
    closePopup("popup-profile");

  document.getElementById("btn-bonus").onclick = () =>
    openPopup("popup-bonus");
  document.getElementById("close-bonus").onclick = () =>
    closePopup("popup-bonus");

});

/* ================= START ================= */
window.addEventListener("load", async () => {
  await getOrCreateUser();
  await applyConfirmedDeposits();
  await loadProfile();
});
</script>
