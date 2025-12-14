<script>

const SUPABASE_URL = "https://ciqyzrgiuvxmhxgladxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// === ПОЛУЧАЕМ ИЛИ СОЗДАЁМ ИГРОКА ===
async function getOrCreateUser() {
  let userId = localStorage.getItem("user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);

    await supabase.from("Users").insert({
      id: userId
    });

    await supabase.from("profiles").insert({
      user_id: userId,
      balance: 0,
      level: 1,
      exp: 0
    });
  }

  return userId;
}

// === ПОЛУЧАЕМ ПРОФИЛЬ ===
async function loadProfile() {
  const userId = await getOrCreateUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("top-balance").innerText =
    "БАЛАНС: " + data.balance + " VC";

  document.getElementById("profile-balance").innerText =
    "Баланс: " + data.balance + " VC";
}

window.addEventListener("load", () => {
  loadProfile();
});
</script>
