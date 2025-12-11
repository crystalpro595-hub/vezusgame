// script.js — положи рядом с index.html

// ----------------- Supabase config (anon key) -----------------
const SUPABASE_URL = 'https://ciqyzrgiuvxmhxgladxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXl6cmdpdXZ4bWh4Z2xhZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTgzMDIsImV4cCI6MjA4MTAzNDMwMn0.21-OjkjEtppQ78o66lQJwa-1c1HSfbka2SD2C0lC1ro';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------- Preloader -----------------
window.addEventListener("load", () => {
  setTimeout(() => {
    const p = document.getElementById("preloader");
    if (p) p.remove();
    document.body.classList.add("show");
  }, 600);
});

// ----------------- Local storage helpers (backup) -----------------
const B='bal', R='req', H='his';
if(!localStorage.getItem(B)) localStorage.setItem(B,'0');
if(!localStorage.getItem(R)) localStorage.setItem(R,'[]');
if(!localStorage.getItem(H)) localStorage.setItem(H,'[]');

const getBalLocal = () => +localStorage.getItem(B);
const setBalLocal = v => { localStorage.setItem(B, String(v)); updateUI(); };
const getReqLocal = () => JSON.parse(localStorage.getItem(R));
const setReqLocal = a => localStorage.setItem(R, JSON.stringify(a));
const getHisLocal = () => JSON.parse(localStorage.getItem(H));
const setHisLocal = a => localStorage.setItem(H, JSON.stringify(a));
const addHisLocal = e => { let a = getHisLocal(); a.unshift(e); setHisLocal(a); };

// ----------------- UI helpers -----------------
function updateUI() {
  const top = document.getElementById("top-balance");
  const prof = document.getElementById("profile-balance");
  if (top) top.textContent = "БАЛАНС: " + getBalLocal() + " VC";
  if (prof) prof.textContent = "Баланс: " + getBalLocal() + " VC";
}

const show = id => { const el = document.getElementById(id); if (el) el.style.display = "flex"; };
const hide = id => { const el = document.getElementById(id); if (el) el.style.display = "none"; };
const hideAll = () => document.querySelectorAll(".popup").forEach(p => p.style.display = "none");

// ----------------- Player auto-create -----------------
let playerId = localStorage.getItem("player_id");
if (!playerId) {
  playerId = "player_" + Math.floor(Math.random() * 999999999);
  localStorage.setItem("player_id", playerId);
  console.log("Создан новый ID игрока:", playerId);
} else {
  console.log("ID игрока найден:", playerId);
}

async function createPlayerOnServer() {
  try {
    const { data, error } = await supabase
      .from('players')
      .upsert([{ id: playerId, username: playerId }])
      .select();
    if (error) console.error("createPlayerOnServer error:", error);
    else console.log("Игрок создан/подтверждён:", data);
  } catch (err) {
    console.error("createPlayerOnServer exception:", err);
  }
}

// ----------------- Balance functions (server via RPC adjust_balance) -----------------
async function fetchBalanceFromServer() {
  try {
    const { data, error } = await supabase
      .from('balances')
      .select('balance')
      .eq('player_id', playerId)
      .single();

    if (error || !data) {
      setBalLocal(0);
      return 0;
    }
    const b = Number(data.balance || 0);
    setBalLocal(b);
    return b;
  } catch (err) {
    console.error('fetchBalanceFromServer', err);
    setBalLocal(0);
    return 0;
  }
}

async function changeBalanceOnServer(amount, note='') {
  const { data, error } = await supabase
    .rpc('adjust_balance', { p_player_id: playerId, p_amount: amount, p_note: note });

  if (error) {
    console.error('changeBalanceOnServer error:', error);
    throw error;
  }
  await fetchBalanceFromServer();
  return data;
}

// ----------------- History (server + local) -----------------
async function fetchHistoryFromServer() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, type, note, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('fetchHistoryFromServer', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function renderHis() {
  const serverHistory = await fetchHistoryFromServer();
  const box = document.getElementById("history-list");
  if (!box) return;
  box.innerHTML = "";

  if ((serverHistory.length === 0) && getHisLocal().length === 0) {
    box.innerHTML = "<div style='color:#bbb;padding:12px;text-align:center'>Пусто</div>";
    return;
  }

  serverHistory.forEach(v => {
    const d = document.createElement("div"); d.className = "item";
    const L = document.createElement("div");
    L.innerHTML = `<div style="font-weight:800">${v.type}</div><div class="meta">${new Date(v.created_at).toLocaleString()}</div>`;
    const R = document.createElement("div");
    if (v.type === "deposit" || v.type === "promo") R.innerHTML = `<div class="status-c">+${v.amount}</div>`;
    else {
      let amt = v.amount;
      if (amt < 0) amt = '-' + Math.abs(amt);
      R.innerHTML = `<div class="status-r">${amt}</div>`;
    }
    d.appendChild(L); d.appendChild(R); box.appendChild(d);
  });

  getHisLocal().forEach(v => {
    const d = document.createElement("div"); d.className = "item";
    const L = document.createElement("div");
    L.innerHTML = `<div style="font-weight:800">${v.type}</div><div class="meta">${new Date(v.time).toLocaleString()}</div>`;
    const R = document.createElement("div");
    R.innerHTML = v.type === "deposit" || v.type === "promo" ? `<div class="status-c">+${v.sum}</div>` : `<div class="status-r">-${v.sum}</div>`;
    d.appendChild(L); d.appendChild(R); box.appendChild(d);
  });
}

// ----------------- Requests (local UI) -----------------
function renderReq(){
  const r = getReqLocal();
  const box = document.getElementById("requests-list");
  if (!box) return;
  box.innerHTML = "";
  if(!r.length){ box.innerHTML = "<div style='color:#bbb;padding:12px;text-align:center'>Пусто</div>"; return; }
  r.forEach(v => {
    const d = document.createElement("div"); d.className = "item";
    const L = document.createElement("div");
    L.innerHTML = `<div style="font-weight:900">${v.type==="dep" ? v.sum+" ₽ → "+v.sum+" VC" : v.sum+" VC"}</div><div class="meta">${new Date(v.time).toLocaleString()}</div>`;
    if(v.type==="wd") L.innerHTML += `<div class="meta">${v.bank} • ${v.phone}</div>`;
    const R = document.createElement("div");
    const s = document.createElement("div");
    s.textContent = v.status.toUpperCase();
    s.className = v.status==="pending"?"status-p":v.status==="confirmed"?"status-c":"status-r";
    R.appendChild(s);
    if(v.status==="pending"){
      const c=document.createElement("button"), rj=document.createElement("button");
      c.textContent="CONFIRM"; rj.textContent="REJECT";
      c.style.cssText=rj.style.cssText="padding:6px 8px;border-radius:6px;color:#fff;margin-left:6px;border:0";
      c.style.background="#1b5e20"; rj.style.background="#790000";
      c.onclick=()=>reqSet(v.id,"confirmed");
      rj.onclick=()=>reqSet(v.id,"rejected");
      R.appendChild(c); R.appendChild(rj);
    }
    d.appendChild(L); d.appendChild(R); box.appendChild(d);
  });
}

function reqSet(id, st){
  const r = getReqLocal(); const i = r.findIndex(x => x.id === id); if(i<0) return;
  const v = r[i]; r[i].status = st; setReqLocal(r);
  if(st === "confirmed"){
    if(v.type === "dep"){ setBalLocal(getBalLocal()+v.sum); addHisLocal({type:"deposit",sum:v.sum,time:Date.now()}); }
    if(v.type === "wd"){ addHisLocal({type:"withdraw",sum:v.sum,time:Date.now()}); }
  } else {
    if(v.type === "wd") setBalLocal(getBalLocal()+v.sum);
    addHisLocal({type:"rejected",sum:v.sum,time:Date.now()});
  }
  renderReq(); renderHis(); updateUI();
}

// ----------------- Promo & Referral -----------------
const PROMO_LIST = { "Vezus50":50, "VezusJ2026":100, "VEZUS2025":25 };
if(!localStorage.getItem("usedPromos")) localStorage.setItem("usedPromos","[]");
const getUsedPromos = () => JSON.parse(localStorage.getItem("usedPromos"));
const setUsedPromos = (arr) => localStorage.setItem("usedPromos", JSON.stringify(arr));

async function onActivatePromo(){
  const code = (document.getElementById("promo-input")?.value || '').trim().toUpperCase();
  const used = getUsedPromos();
  if(!code) return alert("Введите промокод!");
  if(!(code in PROMO_LIST)) return alert("❌ Неверный промокод");
  if(used.includes(code)) return alert("⚠ Этот промокод уже активирован");
  const bonus = PROMO_LIST[code];
  try {
    await changeBalanceOnServer(bonus, 'Promo: '+code);
    setUsedPromos([...used, code]);
    addHisLocal({type:"promo", sum:bonus, time:Date.now()});
    alert("🎉 Промокод активирован! +" + bonus + " VC");
    hideAll();
    renderHis();
  } catch (err) {
    setBalLocal(getBalLocal() + bonus);
    setUsedPromos([...used, code]);
    addHisLocal({type:"promo", sum:bonus, time:Date.now()});
    alert("Промокод применён локально (сервер недоступен). +" + bonus + " VC");
    hideAll();
    renderHis();
  }
}

if(!localStorage.getItem("refCode")) localStorage.setItem("refCode","VZ"+Math.floor(100000+Math.random()*900000));
if(!localStorage.getItem("refFriends")) localStorage.setItem("refFriends","0");
if(!localStorage.getItem("refEarned")) localStorage.setItem("refEarned","0");

function updateReferralUI() {
  const el = document.getElementById("ref-code");
  const st = document.getElementById("ref-stats");
  if(el) el.textContent = localStorage.getItem("refCode");
  if(st) st.innerHTML = "Приглашено друзей: <b>" + localStorage.getItem("refFriends") + "</b><br>Заработано: <b>" + localStorage.getItem("refEarned") + " VC</b>";
}

// ----------------- Deposit / Withdraw -----------------
function onToPayment(e){
  e && e.preventDefault();
  const sum = +document.getElementById("deposit-amount")?.value || 0;
  if(sum < 100) return alert("Минимальная сумма пополнения: 100 ₽");
  hideAll();
  show("popup-payment");
  document.getElementById("pay-amount-text").textContent = sum + " ₽";
  document.getElementById("qr-image").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent("SBP|+79901510597|" + sum);
}

async function onConfirmPaid(e){
  e && e.preventDefault();
  const sum = +document.getElementById("pay-amount-text").textContent.replace(/\D/g,"") || 0;
  const r = getReqLocal();
  r.unshift({id:"r"+Date.now(),type:"dep",sum,sum_rub:sum,status:"pending",time:Date.now()});
  setReqLocal(r);
  try {
    await changeBalanceOnServer(sum, 'SBP deposit');
    r[0].status = 'confirmed';
    setReqLocal(r);
    addHisLocal({type:"deposit",sum:sum,time:Date.now()});
    alert("Пополнение подтверждено и зачислено!");
    hideAll();
    renderReq();
    updateUI();
    renderHis();
  } catch (err) {
    alert("Заявка создана и ожидает подтверждения (или ошибка автоматического зачисления).");
    hideAll();
    renderReq();
  }
}

async function onSubmitWithdraw(e){
  e && e.preventDefault();
  const s = +document.getElementById("withdraw-amount")?.value || 0;
  if(s < 500) return alert("Минимальный вывод: 500 VC");
  if(getBalLocal() < s) return alert("Недостаточно средств");
  const r = getReqLocal();
  r.unshift({
    id:"r"+Date.now(),
    type:"wd",
    sum:s,
    bank:document.getElementById("withdraw-bank")?.value || '',
    phone:document.getElementById("withdraw-phone")?.value || '',
    status:"pending",
    time:Date.now()
  });
  setReqLocal(r);
  try {
    await changeBalanceOnServer(-s, 'Withdraw request');
    addHisLocal({type:"withdraw_request",sum:s,time:Date.now()});
    alert("Заявка на вывод создана. Баланс списан.");
    hideAll();
    renderReq();
    updateUI();
    renderHis();
  } catch (err) {
    alert("Ошибка при создании заявки: " + (err.message || err));
  }
}

// ----------------- Test buttons -----------------
async function addMoney(){
  try {
    await changeBalanceOnServer(100, 'Manual add +100');
    addHisLocal({type:"deposit",sum:100,time:Date.now()});
    updateUI();
    renderHis();
    alert('Добавлено +100 VC');
  } catch (err) {
    alert('Ошибка: ' + (err.message || err));
  }
}

async function removeMoney(){
  try {
    if(getBalLocal() < 50) return alert('Недостаточно средств');
    await changeBalanceOnServer(-50, 'Manual remove -50');
    addHisLocal({type:"withdraw",sum:50,time:Date.now()});
    updateUI();
    renderHis();
    alert('Списано -50 VC');
  } catch (err) {
    alert('Ошибка: ' + (err.message || err));
  }
}

// ----------------- Progress -----------------
async function saveProgress(progress){
  const { error } = await supabase
    .from("progress")
    .upsert({
      player_id: playerId,
      data: progress,
      last_save: new Date().toISOString()
    });
  if(error) { console.error("Ошибка сохранения прогресса:", error); alert('Ошибка сохранения прогресса'); }
  else alert('Прогресс сохранён');
}

async function loadProgress(){
  const { data, error } = await supabase
    .from("progress")
    .select("data")
    .eq("player_id", playerId)
    .single();
  if(error || !data) { alert('Прогресс не найден'); return null; }
  return data.data;
}

// ----------------- Attach event listeners on DOM ready -----------------
document.addEventListener("DOMContentLoaded", () => {
  // Wallet
  const walletOpen = document.getElementById("wallet-open"); if (walletOpen) walletOpen.addEventListener("click", ()=>{ hideAll(); show("popup-wallet"); });
  const closeWallet = document.getElementById("close-wallet"); if (closeWallet) closeWallet.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });

  // Deposit open/close
  const openDeposit = document.getElementById("open-deposit"); if (openDeposit) openDeposit.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); show("popup-deposit"); });
  const closeDeposit = document.getElementById("close-deposit"); if (closeDeposit) closeDeposit.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });

  // Payment
  const toPayment = document.getElementById("to-payment"); if (toPayment) toPayment.addEventListener("click", onToPayment);
  const closePayment = document.getElementById("close-payment"); if (closePayment) closePayment.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });
  const confirmPaid = document.getElementById("confirm-paid"); if (confirmPaid) confirmPaid.addEventListener("click", onConfirmPaid);

  // Withdraw
  const openWithdraw = document.getElementById("open-withdraw"); if (openWithdraw) openWithdraw.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); show("popup-withdraw"); });
  const closeWithdraw = document.getElementById("close-withdraw"); if (closeWithdraw) closeWithdraw.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });
  const submitWithdraw = document.getElementById("submit-withdraw"); if (submitWithdraw) submitWithdraw.addEventListener("click", onSubmitWithdraw);

  // Requests
  const openRequests = document.getElementById("open-requests"); if (openRequests) openRequests.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); renderReq(); show("popup-requests"); });
  const closeRequests = document.getElementById("close-requests"); if (closeRequests) closeRequests.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });

  // Profile
  const btnProfile = document.getElementById("btn-profile"); if (btnProfile) btnProfile.addEventListener("click", async ()=>{ hideAll(); await fetchBalanceFromServer(); await renderHis(); show("popup-profile"); });
  const closeProfile = document.getElementById("close-profile"); if (closeProfile) closeProfile.addEventListener("click", (e)=>{ e.preventDefault(); hideAll(); });

  // Bonus / promocode / referral
  const btnBonus = document.getElementById("btn-bonus"); if (btnBonus) btnBonus.addEventListener("click", ()=>{ hideAll(); show("popup-bonus"); });
  const closeBonus = document.getElementById("close-bonus"); if (closeBonus) closeBonus.addEventListener("click", ()=>hideAll());
  const bonusPromocode = document.getElementById("bonus-promocode"); if (bonusPromocode) bonusPromocode.addEventListener("click", ()=>{ hideAll(); show("popup-promocode"); });
  const closePromocode = document.getElementById("close-promocode"); if (closePromocode) closePromocode.addEventListener("click", ()=>hideAll());
  const activatePromo = document.getElementById("activate-promo"); if (activatePromo) activatePromo.addEventListener("click", onActivatePromo);
  const bonusReferral = document.getElementById("bonus-referral"); if (bonusReferral) bonusReferral.addEventListener("click", ()=>{ hideAll(); show("popup-referral"); updateReferralUI(); });
  const closeReferral = document.getElementById("close-referral"); if (closeReferral) closeReferral.addEventListener("click", ()=>hideAll());
  const copyRef = document.getElementById("copy-ref"); if (copyRef) copyRef.addEventListener("click", ()=>{ let code = localStorage.getItem("refCode"); let link = "https://vezus.com/?ref=" + code; navigator.clipboard.writeText(link); alert("Ссылка скопирована!"); });

  // deposit amount input
  const depositAmount = document.getElementById("deposit-amount"); if (depositAmount) depositAmount.addEventListener("input", ()=>{ document.getElementById("vc-estimate").textContent = (+document.getElementById("deposit-amount").value || 0) + " VC"; });

  // test buttons (if present)
  // (you can keep manual testing buttons that call addMoney/removeMoney; here we ensure functions exist globally)
  window.addMoney = addMoney;
  window.removeMoney = removeMoney;
  window.saveProgressTest = function(){ saveProgress({level:3,xp:250,coins:Math.floor(Math.random()*1000)}); };
  window.loadProgressTest = async function(){ const p = await loadProgress(); alert('Прогресс: ' + JSON.stringify(p)); };
});

// ----------------- Init -----------------
(async () => {
  await createPlayerOnServer();
  await fetchBalanceFromServer();
  await renderHis();
})();

// ----------------- SNOW effect (kept) -----------------
(function snowInit(){
  function createSnowflake() {
      const snow = document.createElement("div");
      snow.classList.add("snowflake");
      snow.textContent = "❄";
      let size = Math.random() * 10 + 8;
      snow.style.fontSize = size + "px";
      snow.style.left = Math.random() * 100 + "vw";
      let duration = Math.random() * 10 + 10;
      snow.style.animationDuration = duration + "s";
      document.getElementById("snow-container")?.appendChild(snow);
      setTimeout(() => snow.remove(), duration * 1000);
  }
  setInterval(createSnowflake, 350);
})();
