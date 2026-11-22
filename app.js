const CATEGORIES = [
  {id:"food",name:"Alimentação",icon:"🍽️"},{id:"home",name:"Moradia",icon:"🏠"},{id:"transport",name:"Transporte",icon:"🚗"},{id:"health",name:"Saúde",icon:"💊"},{id:"leisure",name:"Lazer",icon:"🎬"},{id:"shopping",name:"Compras",icon:"🛍️"},{id:"education",name:"Educação",icon:"📚"},{id:"services",name:"Serviços",icon:"🧾"},{id:"travel",name:"Viagem",icon:"✈️"},{id:"other",name:"Outros",icon:"✨"}
];
const PAYMENT = {credit:"Crédito",debit:"Débito",pix:"PIX",cash:"Dinheiro",transfer:"Transferência"};
const $ = id => document.getElementById(id);
const money = n => (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const monthDate = key => new Date(Number(key.slice(0,4)),Number(key.slice(5,7))-1,1);
const monthLabel = d => d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
let db, selectedMonth = monthKey(new Date()), toastTimer;
let expenses = [], budgets = {};

function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open("MeuControleDB",1);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore("expenses",{keyPath:"id"});d.createObjectStore("settings",{keyPath:"key"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function store(name,mode="readonly"){return db.transaction(name,mode).objectStore(name);}
function getAll(name){return new Promise((res,rej)=>{const r=store(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function put(name,value){return new Promise((res,rej)=>{const tx=db.transaction(name,"readwrite");tx.objectStore(name).put(value);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
function remove(name,key){return new Promise((res,rej)=>{const tx=db.transaction(name,"readwrite");tx.objectStore(name).delete(key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
function getSetting(key){return new Promise(res=>{const r=store("settings").get(key);r.onsuccess=()=>res(r.result?.value);r.onerror=()=>res(undefined);});}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400);}
function category(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES.at(-1);}
function installmentsFor(exp){const n=Math.max(1,Number(exp.installments)||1), total=Math.round(Number(exp.amount)*100);const base=Math.floor(total/n), remainder=total%n;const start=new Date(exp.date+"T12:00:00");return Array.from({length:n},(_,i)=>{const d=new Date(start.getFullYear(),start.getMonth()+i,1);return {month:monthKey(d),amount:(base+(i<remainder?1:0))/100,index:i+1,total:n};});}
function entriesForMonth(key){const rows=[];for(const e of expenses){for(const part of installmentsFor(e)){if(part.month===key)rows.push({...e,partAmount:part.amount,partIndex:part.index,partTotal:part.total,isInstallment:part.total>1});}}return rows.sort((a,b)=>b.date.localeCompare(a.date));}
function totalsFor(key){const rows=entriesForMonth(key);return {rows,total:rows.reduce((s,e)=>s+e.partAmount,0),cash:rows.filter(e=>e.payment!=="credit").reduce((s,e)=>s+e.partAmount,0),credit:rows.filter(e=>e.payment==="credit").reduce((s,e)=>s+e.partAmount,0)};}
function render(){
  $("monthTitle").textContent=monthLabel(monthDate(selectedMonth));
  const data=totalsFor(selectedMonth);
  $("monthTotal").textContent=money(data.total);
  $("expenseCount").textContent=`${data.rows.length} ${data.rows.length===1?"lançamento":"lançamentos"}`;
  $("monthComparison").textContent="Compras e parcelas";
  $("cashTotal").textContent=money(data.cash);
  $("installmentTotal").textContent=money(data.credit);
  $("transactionCount").textContent=`${data.rows.length} itens`;
  renderBudgets(data.rows);renderCategories(data.rows);renderForecast();renderExpenses(data.rows);
}
function renderBudgets(rows){
  const host=$("budgetList");host.innerHTML="";
  const withBudget=CATEGORIES.filter(c=>Number(budgets[c.id])>0);
  if(!withBudget.length){host.innerHTML='<div class="empty">Você ainda não definiu limites.<br>Toque em <b>Editar</b> para planejar seus gastos.</div>';return;}
  withBudget.forEach(c=>{const spent=rows.filter(e=>e.category===c.id).reduce((s,e)=>s+e.partAmount,0),limit=Number(budgets[c.id]),pct=spent/limit*100;
    const el=document.createElement("div");el.className="budget-row";el.innerHTML=`<div class="budget-top"><div class="item-left"><div class="cat-icon">${c.icon}</div><div><div class="item-name">${c.name}</div><div class="item-sub">${money(spent)} de ${money(limit)}</div></div></div><div class="amount-small">${Math.round(pct)}%</div></div><div class="progress ${pct>100?"over":""}"><span style="width:${Math.min(100,pct)}%"></span></div>`;host.append(el);
  });
}
function renderCategories(rows){
  const host=$("categoryList");host.innerHTML="";
  const sums=CATEGORIES.map(c=>({...c,total:rows.filter(e=>e.category===c.id).reduce((s,e)=>s+e.partAmount,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  if(!sums.length){host.innerHTML='<div class="empty">Seus gastos por categoria aparecerão aqui.</div>';return;}
  const max=sums[0].total;
  sums.forEach(c=>{const el=document.createElement("div");el.className="category-row";el.innerHTML=`<div class="item-left"><div class="cat-icon">${c.icon}</div><div><div class="item-name">${c.name}</div><div class="item-sub">${Math.round(c.total/(rows.reduce((s,e)=>s+e.partAmount,0)||1)*100)}% do total</div></div></div><div class="category-right"><strong>${money(c.total)}</strong><div class="progress" style="width:82px;margin-top:7px"><span style="width:${c.total/max*100}%"></span></div></div>`;host.append(el);});
}
function renderForecast(){
  const host=$("forecastList");host.innerHTML="";
  for(let i=0;i<6;i++){const d=monthDate(selectedMonth);d.setMonth(d.getMonth()+i);const key=monthKey(d);const total=totalsFor(key).total;
    const el=document.createElement("div");el.className="forecast-row";el.innerHTML=`<span class="forecast-month">${monthLabel(d)}</span><strong class="forecast-amount">${money(total)}</strong>`;host.append(el);}
}
function renderExpenses(rows){
  const host=$("expenseList");host.innerHTML="";
  if(!rows.length){host.innerHTML='<div class="empty">Nenhum gasto neste mês.<br>Toque em <b>Novo gasto</b> para começar.</div>';return;}
  rows.forEach(e=>{const c=category(e.category),date=new Date(e.date+"T12:00:00").toLocaleDateString("pt-BR");const row=document.createElement("div");row.className="expense-row";
    row.innerHTML=`<div class="cat-icon">${c.icon}</div><div class="expense-main"><div class="expense-title">${escapeHTML(e.description)}</div><div class="expense-meta">${c.name} · ${PAYMENT[e.payment]} · ${date}${e.isInstallment?` · ${e.partIndex}/${e.partTotal}`:""}</div></div><div class="expense-end"><strong>${money(e.partAmount)}</strong><small>${e.isInstallment?"parcela":"à vista"}</small></div><div class="row-actions"><button class="mini-btn edit" aria-label="Editar">✎</button><button class="mini-btn delete" aria-label="Excluir">×</button></div>`;
    row.querySelector(".edit").onclick=()=>editExpense(e.id);row.querySelector(".delete").onclick=()=>deleteExpense(e.id);host.append(row);
  });
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fillCategories(){ $("category").innerHTML=CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");}
function toggleInstallments(){const credit=$("payment").value==="credit";$("installmentFields").style.display=credit?"block":"none";if(!credit)$("installments").value="1";}
function resetExpenseForm(){ $("expenseForm").reset();$("expenseId").value="";$("date").value=dateISO(new Date());$("payment").value="credit";$("installments").value="1";$("expenseDialogTitle").textContent="Novo gasto";toggleInstallments();}
function editExpense(id){const e=expenses.find(x=>x.id===id);if(!e)return;resetExpenseForm();$("expenseId").value=e.id;$("description").value=e.description;$("amount").value=e.amount;$("date").value=e.date;$("payment").value=e.payment;$("category").value=e.category;$("installments").value=e.installments;$("notes").value=e.notes||"";$("expenseDialogTitle").textContent="Editar gasto";toggleInstallments();$("expenseDialog").showModal();}
async function deleteExpense(id){if(!confirm("Excluir este gasto e todas as parcelas futuras dele?"))return;await remove("expenses",id);expenses=await getAll("expenses");render();showToast("Gasto excluído.");}
async function saveExpense(ev){ev.preventDefault();const id=$("expenseId").value||crypto.randomUUID();const payment=$("payment").value;const amount=Number($("amount").value);if(!Number.isFinite(amount)||amount<=0){showToast("Informe um valor válido.");return;}
  const old=expenses.find(e=>e.id===id);const e={id,description:$("description").value.trim(),amount:Math.round(amount*100)/100,date:$("date").value,payment,category:$("category").value,installments:payment==="credit"?Number($("installments").value):1,notes:$("notes").value.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(!e.description||!e.date){showToast("Preencha descrição e data.");return;}await put("expenses",e);expenses=await getAll("expenses");$("expenseDialog").close();selectedMonth=monthKey(new Date(e.date+"T12:00:00"));render();showToast("Gasto salvo com sucesso!");}
function renderBudgetInputs(){const host=$("budgetInputs");host.innerHTML=CATEGORIES.map(c=>`<div class="budget-input-row"><span>${c.icon} ${c.name}</span><input type="number" min="0" step="0.01" inputmode="decimal" placeholder="Sem limite" data-budget="${c.id}" value="${budgets[c.id]||""}"></div>`).join("");}
async function saveBudgets(ev){ev.preventDefault();const next={};document.querySelectorAll("[data-budget]").forEach(i=>{if(Number(i.value)>0)next[i.dataset.budget]=Math.round(Number(i.value)*100)/100;});budgets=next;await put("settings",{key:"budgets",value:budgets});$("budgetDialog").close();render();showToast("Orçamentos atualizados.");}
function openHistory(){const host=$("historyList");host.innerHTML="";const keys=new Set();expenses.forEach(e=>installmentsFor(e).forEach(p=>keys.add(p.month)));const sorted=[...keys].sort().reverse().slice(0,18);if(!sorted.length)host.innerHTML='<div class="empty">Seu histórico aparecerá depois do primeiro lançamento.</div>';sorted.forEach(k=>{const t=totalsFor(k),d=monthDate(k),el=document.createElement("div");el.className="history-row";el.innerHTML=`<span class="forecast-month">${monthLabel(d)}</span><strong>${money(t.total)}</strong>`;el.onclick=()=>{selectedMonth=k;$("historyDialog").close();render();window.scrollTo({top:0,behavior:"smooth"});};host.append(el);});$("historyDialog").showModal();}
async function exportBackup(){const payload={app:"Meu Controle",version:1,exportedAt:new Date().toISOString(),expenses,budgets};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`meu-controle-backup-${dateISO(new Date())}.json`;a.click();URL.revokeObjectURL(url);showToast("Backup exportado.");}
async function importBackup(file){try{const data=JSON.parse(await file.text());if(data.app!=="Meu Controle"||!Array.isArray(data.expenses)||!data.budgets||typeof data.budgets!=="object")throw new Error("Arquivo inválido");
  if(!confirm(`Restaurar ${data.expenses.length} gastos? Os dados atuais serão substituídos.`))return;
  const tx=db.transaction(["expenses","settings"],"readwrite");const es=tx.objectStore("expenses"),ss=tx.objectStore("settings");es.clear();data.expenses.forEach(e=>es.put(e));ss.put({key:"budgets",value:data.budgets});tx.oncomplete=async()=>{expenses=await getAll("expenses");budgets=await getSetting("budgets")||{};render();$("backupDialog").close();showToast("Backup restaurado.");};
 }catch(err){showToast("Não foi possível ler esse backup.");}}
async function clearAll(){if(!confirm("Tem certeza? Todos os gastos e orçamentos serão apagados permanentemente."))return;const tx=db.transaction(["expenses","settings"],"readwrite");tx.objectStore("expenses").clear();tx.objectStore("settings").clear();tx.oncomplete=async()=>{expenses=[];budgets={};render();$("settingsDialog").close();showToast("Dados apagados.");};}
function wire(){
  $("prevMonth").onclick=()=>{const d=monthDate(selectedMonth);d.setMonth(d.getMonth()-1);selectedMonth=monthKey(d);render();};
  $("nextMonth").onclick=()=>{const d=monthDate(selectedMonth);d.setMonth(d.getMonth()+1);selectedMonth=monthKey(d);render();};
  $("addExpenseBtn").onclick=()=>{resetExpenseForm();$("expenseDialog").showModal();};
  $("payment").onchange=toggleInstallments;$("expenseForm").onsubmit=saveExpense;
  $("manageBudgets").onclick=()=>{renderBudgetInputs();$("budgetDialog").showModal();};$("budgetForm").onsubmit=saveBudgets;
  $("backupBtn").onclick=()=>$("backupDialog").showModal();$("exportBtn").onclick=exportBackup;$("importFile").onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value="";};
  $("historyBtn").onclick=openHistory;$("settingsBtn").onclick=()=>$("settingsDialog").showModal();$("clearDataBtn").onclick=clearAll;
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
}
async function init(){try{db=await openDB();expenses=await getAll("expenses");budgets=await getSetting("budgets")||{};fillCategories();wire();resetExpenseForm();render();if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});}catch(e){document.body.innerHTML='<div style="padding:30px;color:white">Não foi possível iniciar o armazenamento local. Abra este aplicativo em um navegador atualizado.</div>';console.error(e);}}
init();
