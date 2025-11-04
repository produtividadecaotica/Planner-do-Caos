import { useEffect, useMemo, useState } from "react";
import { DateTime, Interval } from "luxon";
import { FINANCE_CATEGORIES, formatBRL, storage, uid } from "../lib/utils.js";
import { buildRRuleString, expandOccurrences, humanizeRRule } from "../lib/rrule.js";
import Tabs from "../ui/tabs.jsx";
import Dialog from "../ui/dialog.jsx";
import Select from "../ui/select.jsx";
import { ChevronLeft, ChevronRight, CreditCard, Plus, Trash2, Wallet, Calendar as Cal, Repeat, PiggyBank, Filter } from "lucide-react";

/** ============ STORAGE KEYS ============ */
const K = {
  wallets: "finance.wallets",            // [{id,name,balance}]
  cards: "finance.cards",                // [{id,name,limit,closingDay,dueDay,brand,last4}]
  categories: "finance.categories",      // [strings]
  tx: "finance.transactions",            // [{id,dateISO,desc,amount,category,walletId,cardId,type,groupId}]
  bills: "finance.bills",                // [{id,kind:'pay'|'receive',title,amount,dueISO,category,rrule,notes}]
  budgets: "finance.budgets",            // { 'YYYY-MM': { [category]: number } }
  piggy: "finance.piggy",                // { goal:number, saved:number }
  settings: "finance.settings",          // { currency:'BRL' }
};

/** ============ HELPERS ============ */
function load(key, fb) { return storage.get(key, fb); }
function save(key, val) { storage.set(key, val); }

function ymKey(dt = DateTime.now()) { return DateTime.fromJSDate(dt instanceof Date ? dt : new Date(dt)).toFormat("yyyy-LL"); }
function startOfMonth(dt) { return DateTime.fromISO(dt).startOf("month"); }
function endOfMonth(dt) { return DateTime.fromISO(dt).endOf("month"); }

/** Fatura atual (período) dado closingDay (fechamento) */
function currentStatementRange(closingDay) {
  const today = DateTime.now();
  const closingThis = today.set({ day: Math.min(closingDay, today.daysInMonth) }).endOf("day");
  const start = today <= closingThis
    ? closingThis.minus({ months: 1 }).plus({ days: 1 }).startOf("day")
    : closingThis.plus({ days: 1 }).startOf("day");
  const end = start.plus({ months: 1 }).minus({ days: 1 }).endOf("day");
  return { start, end };
}

/** Filtra transações por data e chave (wallet/card/category) */
function filterTx(txs, { from, to, walletId, cardId, category }) {
  return txs.filter((t) => {
    const d = DateTime.fromISO(t.dateISO);
    if (from && d < from) return false;
    if (to && d > to) return false;
    if (walletId && t.walletId !== walletId) return false;
    if (cardId && t.cardId !== cardId) return false;
    if (category && t.category !== category) return false;
    return true;
  });
}

/** Soma (números) */
const sum = (arr) => arr.reduce((acc, n) => acc + Number(n || 0), 0);

/** ============ PAGE ============ */
export default function FinancePage() {
  // === Estado global (persistido) ===
  const [wallets, setWallets] = useState(() => load(K.wallets, []));
  const [cards, setCards] = useState(() => load(K.cards, []));
  const [categories, setCategories] = useState(() => load(K.categories, FINANCE_CATEGORIES));
  const [tx, setTx] = useState(() => load(K.tx, []));
  const [bills, setBills] = useState(() => load(K.bills, []));
  const [budgets, setBudgets] = useState(() => load(K.budgets, {}));
  const [piggy, setPiggy] = useState(() => load(K.piggy, { goal: 10000, saved: 0 }));

  useEffect(() => save(K.wallets, wallets), [wallets]);
  useEffect(() => save(K.cards, cards), [cards]);
  useEffect(() => save(K.categories, categories), [categories]);
  useEffect(() => save(K.tx, tx), [tx]);
  useEffect(() => save(K.bills, bills), [bills]);
  useEffect(() => save(K.budgets, budgets), [budgets]);
  useEffect(() => save(K.piggy, piggy), [piggy]);

  // === Cursor temporal do dashboard ===
  const [monthCursor, setMonthCursor] = useState(DateTime.now().startOf("month").toISODate());
  const mStart = useMemo(() => DateTime.fromISO(monthCursor).startOf("month"), [monthCursor]);
  const mEnd = useMemo(() => DateTime.fromISO(monthCursor).endOf("month"), [monthCursor]);

  // === Métricas do dashboard ===
  const monthTx = useMemo(() => filterTx(tx, { from: mStart, to: mEnd }), [tx, mStart, mEnd]);
  const monthOut = useMemo(() => sum(monthTx.filter(t => Number(t.amount) < 0).map(t => t.amount)), [monthTx]); // negativo
  const monthIn = useMemo(() => sum(monthTx.filter(t => Number(t.amount) > 0).map(t => t.amount)), [monthTx]); // positivo

  const totalWalletBalance = useMemo(() => sum(wallets.map(w => w.balance || 0)), [wallets]);

  // Próximos vencimentos (7 dias) — bills (expansão de recorrência)
  const next7 = useMemo(() => {
    const windowStart = DateTime.now().startOf("day");
    const windowEnd = DateTime.now().plus({ days: 7 }).endOf("day");
    const list = [];
    for (const b of bills) {
      if (b.rrule) {
        const occ = expandOccurrences({
          rruleString: b.rrule,
          rangeStartISO: windowStart.toISO(),
          rangeEndISO: windowEnd.toISO(),
          maxCount: 20,
        });
        for (const o of occ) list.push({ ...b, dueISO: o });
      } else if (b.dueISO) {
        const d = DateTime.fromISO(b.dueISO);
        if (d >= windowStart && d <= windowEnd) list.push(b);
      }
    }
    return list.sort((a, b) => DateTime.fromISO(a.dueISO) - DateTime.fromISO(b.dueISO));
  }, [bills]);

  // Cartões — fatura atual e disponível
  const cardsWithStatement = useMemo(() => {
    return cards.map((c) => {
      const { start, end } = currentStatementRange(Number(c.closingDay || 1));
      const statementTx = filterTx(tx, { from: start, to: end, cardId: c.id });
      const used = -sum(statementTx.map(t => Math.min(0, Number(t.amount)))); // somente despesas
      const limit = Number(c.limit || 0);
      const available = Math.max(0, limit - used);
      return { ...c, statement: { start, end, used, available } };
    });
  }, [cards, tx]);

  // Orçamento do mês (por categoria)
  const monthKey = ymKey(mStart.toJSDate());
  const monthBudget = budgets[monthKey] || {};
  const spentByCategory = useMemo(() => {
    const map = {};
    for (const c of categories) map[c] = 0;
    for (const t of monthTx) {
      if (t.category) {
        const v = Number(t.amount || 0);
        if (v < 0) map[t.category] = (map[t.category] || 0) + Math.abs(v);
      }
    }
    return map;
  }, [monthTx, categories]);

  // ============ Ações CRUD ============

  // Carteiras
  function addWallet(w) { setWallets(prev => [...prev, { id: uid("w"), name: w.name, balance: Number(w.balance || 0) }]); }
  function updateWallet(id, patch) { setWallets(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w)); }
  function removeWallet(id) {
    // Ao remover, não apagamos transações; o usuário pode editar depois.
    setWallets(prev => prev.filter(w => w.id !== id));
  }

  // Cartões
  function addCard(c) {
    setCards(prev => [...prev, {
      id: uid("c"), name: c.name, limit: Number(c.limit || 0),
      closingDay: Number(c.closingDay || 1), dueDay: Number(c.dueDay || 10),
      brand: c.brand || "", last4: c.last4 || ""
    }]);
  }
  function updateCard(id, patch) { setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function removeCard(id) { setCards(prev => prev.filter(c => c.id !== id)); }

  // Categorias
  function addCategory(name) {
    const v = name.trim();
    if (!v) return;
    if (!categories.includes(v)) setCategories(prev => [...prev, v]);
  }
  function removeCategory(name) {
    setCategories(prev => prev.filter(c => c !== name));
  }

  // Lançamentos
  function addTx(t) {
    setTx(prev => [...prev, { ...t, id: uid("t") }]);
    // Se for em conta: atualiza saldo
    if (t.walletId) updateWallet(t.walletId, { balance: Number(wallets.find(w => w.id === t.walletId)?.balance || 0) + Number(t.amount) });
  }
  function addTxInstallments(base, n) {
    const start = DateTime.fromISO(base.dateISO).startOf("day");
    const group = uid("g");
    const per = Number(base.amount);
    for (let i = 0; i < n; i++) {
      const dt = start.plus({ months: i });
      addTx({ ...base, dateISO: dt.toISO(), groupId: group });
    }
  }
  function transferTx({ fromWalletId, toWalletId, amount, dateISO, desc }) {
    const a = Number(amount);
    addTx({ dateISO, desc: desc || "Transferência", amount: -Math.abs(a), type: "transfer", walletId: fromWalletId });
    addTx({ dateISO, desc: desc || "Transferência", amount: Math.abs(a), type: "transfer", walletId: toWalletId });
  }
  function removeTx(id) {
    const item = tx.find(t => t.id === id);
    setTx(prev => prev.filter(t => t.id !== id));
    if (item?.walletId) {
      // reverte impacto no saldo
      updateWallet(item.walletId, { balance: Number(wallets.find(w => w.id === item.walletId)?.balance || 0) - Number(item.amount) });
    }
  }

  // Contas (bills)
  function addBill(b) { setBills(prev => [...prev, { ...b, id: uid("b") }]); }
  function removeBill(id) { setBills(prev => prev.filter(b => b.id !== id)); }
  function payBillNow(bill) {
    const v = bill.kind === "receive" ? Math.abs(bill.amount) : -Math.abs(bill.amount);
    addTx({
      dateISO: DateTime.fromISO(bill.dueISO || DateTime.now().toISO()).toISO(),
      desc: `[${bill.kind === "receive" ? "Receber" : "Pagar"}] ${bill.title}`,
      amount: v,
      category: bill.category || "",
      walletId: wallets[0]?.id, // por simplicidade: primeira carteira; depois podemos escolher
      type: "bill",
    });
  }

  // Orçamentos
  function setBudget(cat, value) {
    setBudgets(prev => {
      const next = { ...prev };
      const mk = monthKey;
      next[mk] = { ...(next[mk] || {}), [cat]: Number(value || 0) };
      return next;
    });
  }

  // Cofrinho (meta acumulativa)
  function setPiggyGoal(goal) { setPiggy(prev => ({ ...prev, goal: Number(goal || 0) })); }
  function addPiggy(amount) { setPiggy(prev => ({ ...prev, saved: Math.max(0, Number(prev.saved || 0) + Number(amount || 0)) })); }

  // ============ UI STATES (modais e forms) ============
  const [mod, setMod] = useState(null); // {type:'wallet'|'card'|'tx'|'transfer'|'bill'|'category', data?:{}}

  // ============ COMPONENTES ============

  function MonthNav() {
    const cur = DateTime.fromISO(monthCursor);
    return (
      <div className="flex items-center gap-2">
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMonthCursor(cur.minus({ months: 1 }).toISODate())}><ChevronLeft className="w-4 h-4" /></button>
        <div className="text-sm text-[var(--pc-muted)] min-w-[160px] text-center">{cur.toFormat("LLLL 'de' yyyy")}</div>
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMonthCursor(cur.plus({ months: 1 }).toISODate())}><ChevronRight className="w-4 h-4" /></button>
        <button className="ml-2 rounded-md border px-3 py-1.5 text-sm" onClick={() => setMonthCursor(DateTime.now().toISODate())}>Hoje</button>
      </div>
    );
  }

  function Dashboard() {
    // próximos vencimentos: bills + cartões (vencimento de fatura)
    const cardDues = cardsWithStatement.map((c) => {
      const monthDue = DateTime.now().set({ day: Math.min(c.dueDay, DateTime.now().daysInMonth) }).endOf("day");
      return { title: `Fatura ${c.name}`, dueISO: monthDue.toISO(), amount: -c.statement.used, kind: "pay", category: "Cartões" };
    });
    const upcoming = [...next7, ...cardDues]
      .filter(i => DateTime.fromISO(i.dueISO) <= DateTime.now().plus({ days: 7 }))
      .sort((a, b) => DateTime.fromISO(a.dueISO) - DateTime.fromISO(b.dueISO))
      .slice(0, 8);

    const totalBudget = sum(Object.values(monthBudget || {}));
    const totalSpentVsBudget = sum(Object.entries(monthBudget).map(([cat, val]) => Math.min(val, spentByCategory[cat] || 0)));
    const budgetPct = totalBudget > 0 ? Math.round((totalSpentVsBudget / totalBudget) * 100) : 0;

    const totalAvailableCredit = sum(cardsWithStatement.map(c => c.statement.available));
    const totalUsedCredit = sum(cardsWithStatement.map(c => c.statement.used));

    return (
      <div className="grid gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Finanças</h1>
            <p className="text-sm text-[var(--pc-muted)]">Controle completo com orçamentos, faturas, recorrências e relatórios.</p>
          </div>
          <MonthNav />
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Saldo em contas" value={formatBRL(totalWalletBalance)} icon={<Wallet className="w-5 h-5" />} />
          <MetricCard title="Entradas no mês" value={formatBRL(monthIn)} />
          <MetricCard title="Despesas no mês" value={formatBRL(Math.abs(monthOut))} />
          <MetricCard title="Orçamento (uso)" value={`${budgetPct}%`} sub={`Limite ${formatBRL(totalBudget)}`} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Cal className="w-4 h-4" /> Próximos 7 dias</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[var(--pc-muted)]">Nada nos próximos dias.</p>
            ) : (
              <ul className="grid gap-2">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-[var(--pc-border)] px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{u.title}</div>
                      <div className="text-[var(--pc-muted)]">{DateTime.fromISO(u.dueISO).toFormat("dd/LL")} • {u.kind === "receive" ? "Receber" : "Pagar"}</div>
                    </div>
                    <div className={`text-sm font-semibold ${u.kind === "receive" ? "text-emerald-600" : "text-red-600"}`}>{formatBRL(Math.abs(u.amount))}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Cartões (fatura atual)</h3>
            {cardsWithStatement.length === 0 ? (
              <p className="text-sm text-[var(--pc-muted)]">Nenhum cartão cadastrado.</p>
            ) : (
              <ul className="grid gap-2">
                {cardsWithStatement.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-[var(--pc-border)] px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{c.name}{c.last4 ? ` •••• ${c.last4}` : ""}</div>
                      <div className="text-[var(--pc-muted)]">
                        {c.statement.start.toFormat("dd/LL")} – {c.statement.end.toFormat("dd/LL")} • Limite {formatBRL(c.limit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Usado: <b>{formatBRL(c.statement.used)}</b></div>
                      <div className="text-xs text-[var(--pc-muted)]">Disponível {formatBRL(c.statement.available)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    );
  }

  function MetricCard({ title, value, sub, icon }) {
    return (
      <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
        <div className="text-xs text-[var(--pc-muted)] mb-1 flex items-center gap-2">{icon}{title}</div>
        <div className="text-lg font-semibold">{value}</div>
        {sub && <div className="text-xs text-[var(--pc-muted)] mt-1">{sub}</div>}
      </div>
    );
  }

  function WalletsAndCards() {
    const [newWallet, setNewWallet] = useState({ name: "", balance: "" });
    const [newCard, setNewCard] = useState({ name: "", limit: "", closingDay: 1, dueDay: 10, brand: "", last4: "" });

    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Carteiras & Bancos</h2>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "category" })}>Categorias</button>
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "transfer" })}>Transferência</button>
          </div>
        </div>

        <section className="grid gap-3">
          <h3 className="text-sm font-medium">Contas</h3>
          <div className="grid gap-2">
            {wallets.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-[var(--pc-border)] px-3 py-2">
                <div className="text-sm">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-[var(--pc-muted)]">Saldo {formatBRL(w.balance)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => {
                    const nv = prompt("Novo saldo:", String(w.balance));
                    if (nv != null) updateWallet(w.id, { balance: Number(nv || 0) });
                  }}>Atualizar saldo</button>
                  <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => setMod({ type: "confirm", onYes: () => removeWallet(w.id), title: "Remover conta?", message: `Excluir ${w.name}?` })}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newWallet.name) return;
              addWallet({ name: newWallet.name, balance: Number(newWallet.balance || 0) });
              setNewWallet({ name: "", balance: "" });
            }}
            className="grid md:grid-cols-[1fr_160px_120px] gap-2"
          >
            <input className="input" placeholder="Nome da conta (ex.: Nubank, Itaú)" value={newWallet.name} onChange={(e) => setNewWallet((p) => ({ ...p, name: e.target.value }))} />
            <input className="input" placeholder="Saldo inicial" value={newWallet.balance} onChange={(e) => setNewWallet((p) => ({ ...p, balance: e.target.value }))} />
            <button className="btn btn-outline" type="submit">+ Adicionar conta</button>
          </form>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-medium">Cartões</h3>
          <div className="grid gap-2">
            {cardsWithStatement.map((c) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-[var(--pc-border)] px-3 py-2 gap-2">
                <div className="text-sm">
                  <div className="font-medium">{c.name} {c.last4 && <>• • • • {c.last4}</>}</div>
                  <div className="text-[var(--pc-muted)]">
                    Limite {formatBRL(c.limit)} • Fechamento dia {c.closingDay} • Vencimento dia {c.dueDay}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>Usado: <b>{formatBRL(c.statement.used)}</b></div>
                  <div className="text-[var(--pc-muted)]">Disponível {formatBRL(c.statement.available)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => {
                    const limit = prompt("Novo limite:", String(c.limit));
                    if (limit != null) updateCard(c.id, { limit: Number(limit || 0) });
                  }}>Editar limite</button>
                  <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => setMod({ type: "confirm", onYes: () => removeCard(c.id), title: "Remover cartão?", message: `Excluir ${c.name}?` })}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCard.name) return;
              addCard(newCard);
              setNewCard({ name: "", limit: "", closingDay: 1, dueDay: 10, brand: "", last4: "" });
            }}
            className="grid md:grid-cols-[1fr_120px_120px_120px_120px_120px] gap-2"
          >
            <input className="input" placeholder="Nome do cartão" value={newCard.name} onChange={(e) => setNewCard(p => ({ ...p, name: e.target.value }))} />
            <input className="input" placeholder="Limite" value={newCard.limit} onChange={(e) => setNewCard(p => ({ ...p, limit: e.target.value }))} />
            <input className="input" placeholder="Fechamento (dia)" value={newCard.closingDay} onChange={(e) => setNewCard(p => ({ ...p, closingDay: e.target.value }))} />
            <input className="input" placeholder="Vencimento (dia)" value={newCard.dueDay} onChange={(e) => setNewCard(p => ({ ...p, dueDay: e.target.value }))} />
            <input className="input" placeholder="Bandeira (opcional)" value={newCard.brand} onChange={(e) => setNewCard(p => ({ ...p, brand: e.target.value }))} />
            <input className="input" placeholder="Final (opcional)" value={newCard.last4} onChange={(e) => setNewCard(p => ({ ...p, last4: e.target.value }))} />
            <div className="md:col-span-6">
              <button className="btn btn-outline w-full md:w-auto" type="submit">+ Adicionar cartão</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  function Transactions() {
    const [f, setF] = useState({ from: mStart.toISODate(), to: mEnd.toISODate(), walletId: "", cardId: "", category: "" });

    const from = f.from ? DateTime.fromISO(f.from).startOf("day") : null;
    const to = f.to ? DateTime.fromISO(f.to).endOf("day") : null;
    const list = useMemo(() => filterTx(tx, {
      from, to,
      walletId: f.walletId || undefined,
      cardId: f.cardId || undefined,
      category: f.category || undefined,
    }).sort((a, b) => DateTime.fromISO(b.dateISO) - DateTime.fromISO(a.dateISO)), [tx, f, from, to]);

    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Lançamentos</h2>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "tx" })}><Plus className="w-4 h-4" /> Novo</button>
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "transfer" })}>Transferência</button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-2">
          <label className="grid gap-1 text-sm">
            <span>De</span>
            <input type="date" className="input" value={f.from} onChange={(e) => setF(p => ({ ...p, from: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Até</span>
            <input type="date" className="input" value={f.to} onChange={(e) => setF(p => ({ ...p, to: e.target.value }))} />
          </label>
          <Select label="Conta" value={f.walletId} onChange={(v) => setF(p => ({ ...p, walletId: v, cardId: "" }))} options={[{ value: "", label: "Todas" }, ...wallets.map(w => ({ value: w.id, label: w.name }))]} />
          <Select label="Cartão" value={f.cardId} onChange={(v) => setF(p => ({ ...p, cardId: v, walletId: "" }))} options={[{ value: "", label: "Todos" }, ...cards.map(c => ({ value: c.id, label: c.name }))]} />
          <Select label="Categoria" value={f.category} onChange={(v) => setF(p => ({ ...p, category: v }))} options={[{ value: "", label: "Todas" }, ...categories.map(c => ({ value: c, label: c }))]} />
        </div>

        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3 shadow-pc overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Conta/Cartão</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{DateTime.fromISO(t.dateISO).toFormat("dd/LL/yyyy")}</td>
                  <td>{t.desc}</td>
                  <td>{t.category || "-"}</td>
                  <td>{t.walletId ? wallets.find(w => w.id === t.walletId)?.name : cards.find(c => c.id === t.cardId)?.name || "-"}</td>
                  <td style={{ textAlign: "right", color: Number(t.amount) < 0 ? "var(--red-600, #dc2626)" : "var(--emerald-600, #059669)" }}>
                    {formatBRL(t.amount)}
                  </td>
                  <td className="text-right">
                    <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => setMod({ type: "confirm", onYes: () => removeTx(t.id), title: "Remover lançamento?", message: t.desc })}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="text-center text-sm text-[var(--pc-muted)] py-6">Nenhum lançamento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function Bills() {
    // Expansão de recorrência para visualização simples mensal
    const [monthView, setMonthView] = useState(DateTime.now().toISODate());
    const mv = DateTime.fromISO(monthView);
    const bStart = mv.startOf("month");
    const bEnd = mv.endOf("month");

    const expanded = useMemo(() => {
      const arr = [];
      for (const b of bills) {
        if (b.rrule) {
          const occ = expandOccurrences({
            rruleString: b.rrule,
            rangeStartISO: bStart.toISO(),
            rangeEndISO: bEnd.toISO(),
            maxCount: 200,
          });
          for (const o of occ) arr.push({ ...b, dueISO: o, _generated: true });
        } else arr.push(b);
      }
      return arr.filter(x => {
        const d = DateTime.fromISO(x.dueISO);
        return d >= bStart && d <= bEnd;
      }).sort((a, b) => DateTime.fromISO(a.dueISO) - DateTime.fromISO(b.dueISO));
    }, [bills, bStart, bEnd]);

    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Contas a pagar/receber</h2>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "bill" })}><Plus className="w-4 h-4" /> Novo</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMonthView(mv.minus({ months: 1 }).toISODate())}><ChevronLeft className="w-4 h-4" /></button>
          <div className="text-sm text-[var(--pc-muted)] min-w-[160px] text-center">{mv.toFormat("LLLL 'de' yyyy")}</div>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMonthView(mv.plus({ months: 1 }).toISODate())}><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3 shadow-pc">
          <table className="table">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th>Recorrência</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expanded.map((b) => (
                <tr key={`${b.id}_${b.dueISO}`}>
                  <td>{DateTime.fromISO(b.dueISO).toFormat("dd/LL/yyyy")}</td>
                  <td>{b.title}</td>
                  <td>{b.kind === "receive" ? "Receber" : "Pagar"}</td>
                  <td>{b.category || "-"}</td>
                  <td style={{ textAlign: "right", color: b.kind === "receive" ? "var(--emerald-600, #059669)" : "var(--red-600, #dc2626)" }}>
                    {formatBRL(Math.abs(b.amount))}
                  </td>
                  <td className="text-xs text-[var(--pc-muted)]">{b.rrule ? humanizeRRule(b.rrule) : "-"}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-md border px-2 py-1 text-xs" onClick={() => payBillNow(b)}>Marcar pago</button>
                      {!b._generated && (
                        <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => setMod({ type: "confirm", onYes: () => removeBill(b.id), title: "Remover conta?", message: b.title })}><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {expanded.length === 0 && (
                <tr><td colSpan={7} className="text-center text-sm text-[var(--pc-muted)] py-6">Sem contas neste mês.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function Budgets() {
    const [catInput, setCatInput] = useState("");
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Orçamentos & Metas</h2>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setMod({ type: "piggy" })}><PiggyBank className="w-4 h-4" /> Cofrinho</button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3 shadow-pc">
          <table className="table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Orçamento</th>
                <th>Gasto</th>
                <th>Progresso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const budget = monthBudget[c] || 0;
                const spent = spentByCategory[c] || 0;
                const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                return (
                  <tr key={c}>
                    <td>{c}</td>
                    <td>
                      <input
                        className="input w-32"
                        value={budget}
                        onChange={(e) => setBudget(c, e.target.value)}
                        placeholder="0,00"
                      />
                    </td>
                    <td>{formatBRL(spent)}</td>
                    <td>
                      <div className="h-2 rounded bg-black/10 dark:bg-white/10 w-full">
                        <div className="h-2 rounded bg-[var(--pc-primary)]" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="text-right">
                      {!FINANCE_CATEGORIES.includes(c) && (
                        <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => removeCategory(c)}><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5}>
                  <div className="flex items-center gap-2">
                    <input className="input" placeholder="Nova categoria…" value={catInput} onChange={(e) => setCatInput(e.target.value)} />
                    <button className="btn btn-outline" onClick={() => { addCategory(catInput); setCatInput(""); }}>+ Adicionar categoria</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function Reports() {
    const [f, setF] = useState({
      from: mStart.minus({ months: 1 }).toISODate(),
      to: mEnd.toISODate(),
      walletId: "", cardId: "", category: ""
    });
    const from = f.from ? DateTime.fromISO(f.from).startOf("day") : null;
    const to = f.to ? DateTime.fromISO(f.to).endOf("day") : null;
    const list = useMemo(() => filterTx(tx, {
      from, to,
      walletId: f.walletId || undefined,
      cardId: f.cardId || undefined,
      category: f.category || undefined,
    }), [tx, f, from, to]);

    const byCat = useMemo(() => {
      const map = {};
      for (const t of list) {
        const cat = t.category || "—";
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      }
      return map;
    }, [list]);

    const total = sum(list.map(t => Number(t.amount)));
    const totalIn = sum(list.filter(t => t.amount > 0).map(t => t.amount));
    const totalOut = -sum(list.filter(t => t.amount < 0).map(t => t.amount));

    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Relatórios</h2>
          <div className="flex gap-2 items-center text-sm text-[var(--pc-muted)]"><Filter className="w-4 h-4" />Filtros</div>
        </div>

        <div className="grid md:grid-cols-5 gap-2">
          <label className="grid gap-1 text-sm">
            <span>De</span>
            <input type="date" className="input" value={f.from} onChange={(e) => setF(p => ({ ...p, from: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Até</span>
            <input type="date" className="input" value={f.to} onChange={(e) => setF(p => ({ ...p, to: e.target.value }))} />
          </label>
          <Select label="Conta" value={f.walletId} onChange={(v) => setF(p => ({ ...p, walletId: v, cardId: "" }))} options={[{ value: "", label: "Todas" }, ...wallets.map(w => ({ value: w.id, label: w.name }))]} />
          <Select label="Cartão" value={f.cardId} onChange={(v) => setF(p => ({ ...p, cardId: v, walletId: "" }))} options={[{ value: "", label: "Todos" }, ...cards.map(c => ({ value: c.id, label: c.name }))]} />
          <Select label="Categoria" value={f.category} onChange={(v) => setF(p => ({ ...p, category: v }))} options={[{ value: "", label: "Todas" }, ...categories.map(c => ({ value: c, label: c }))]} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <MetricCard title="Total Entradas" value={formatBRL(totalIn)} />
          <MetricCard title="Total Saídas" value={formatBRL(totalOut)} />
          <MetricCard title="Saldo do Período" value={formatBRL(total)} />
        </div>

        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3 shadow-pc">
          <table className="table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCat).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, val]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td style={{ textAlign: "right" }}>{formatBRL(val)}</td>
                </tr>
              ))}
              {Object.keys(byCat).length === 0 && (
                <tr><td colSpan={2} className="text-center text-sm text-[var(--pc-muted)] py-6">Sem dados no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============ MODAIS ============

  function ModalSwitch() {
    if (!mod) return null;

    if (mod.type === "confirm") {
      return (
        <Dialog open={true} onClose={() => setMod(null)} title={mod.title}>
          <p className="text-sm text-[var(--pc-muted)] mb-4">{mod.message}</p>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setMod(null)}>Cancelar</button>
            <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "white" }} onClick={() => { mod.onYes?.(); setMod(null); }}>Confirmar</button>
          </div>
        </Dialog>
      );
    }

    if (mod.type === "tx") return <TxModal onClose={() => setMod(null)} onSubmit={(payload) => { if (payload.installments > 1 && payload.cardId) { addTxInstallments(payload, payload.installments); } else { addTx(payload); } setMod(null); }} />;
    if (mod.type === "transfer") return <TransferModal wallets={wallets} onClose={() => setMod(null)} onSubmit={(p) => { transferTx(p); setMod(null); }} />;
    if (mod.type === "bill") return <BillModal categories={categories} onClose={() => setMod(null)} onSubmit={(b) => { addBill(b); setMod(null); }} />;
    if (mod.type === "category") return <CategoryModal categories={categories} onClose={() => setMod(null)} onAdd={(n) => addCategory(n)} onRemove={(n) => removeCategory(n)} />;
    if (mod.type === "piggy") return <PiggyModal piggy={piggy} onClose={() => setMod(null)} onSave={(g) => setPiggy(g)} onAdd={(v) => addPiggy(v)} />;
    return null;
  }

  function TxModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({
      dateISO: DateTime.now().toISO(),
      desc: "",
      amount: "",
      category: "",
      walletId: wallets[0]?.id || "",
      cardId: "",
      type: "expense", // income | expense | transfer (transfer tem modal próprio)
      installments: 1,
    });

    function submit(e) {
      e.preventDefault();
      const amt = Number(form.amount || 0);
      const val = form.type === "income" ? Math.abs(amt) : -Math.abs(amt);
      onSubmit({
        ...form,
        amount: val,
        dateISO: DateTime.fromISO(form.dateISO).toISO(),
        category: form.category || "",
        walletId: form.cardId ? "" : form.walletId,
        cardId: form.cardId || "",
        installments: Number(form.installments || 1),
      });
    }

    return (
      <Dialog open={true} onClose={onClose} title="Novo lançamento">
        <form className="grid gap-3" onSubmit={submit}>
          <label className="grid gap-1 text-sm">
            <span>Data</span>
            <input type="datetime-local" className="input" value={form.dateISO.slice(0, 16)} onChange={(e) => setForm(p => ({ ...p, dateISO: new Date(e.target.value).toISOString() }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Descrição</span>
            <input className="input" value={form.desc} onChange={(e) => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="Ex.: Supermercado, salário…" />
          </label>
          <div className="grid md:grid-cols-3 gap-2">
            <Select label="Tipo" value={form.type} onChange={(v) => setForm(p => ({ ...p, type: v }))} options={[
              { value: "expense", label: "Despesa" },
              { value: "income", label: "Receita" },
            ]} />
            <label className="grid gap-1 text-sm">
              <span>Valor</span>
              <input className="input" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" />
            </label>
            <Select label="Categoria" value={form.category} onChange={(v) => setForm(p => ({ ...p, category: v }))} options={[{ value: "", label: "—" }, ...categories.map(c => ({ value: c, label: c }))]} />
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <Select label="Conta" value={form.walletId} onChange={(v) => setForm(p => ({ ...p, walletId: v, cardId: "" }))} options={[...wallets.map(w => ({ value: w.id, label: w.name }))]} />
            <Select label="Cartão (para compras parceladas)" value={form.cardId} onChange={(v) => setForm(p => ({ ...p, cardId: v, walletId: "" }))} options={[{ value: "", label: "—" }, ...cards.map(c => ({ value: c.id, label: c.name }))]} />
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm">
              <span>Parcelas</span>
              <input className="input" value={form.installments} onChange={(e) => setForm(p => ({ ...p, installments: e.target.value }))} placeholder="1" />
            </label>
            <div className="text-xs text-[var(--pc-muted)] self-end">
              Se &gt; 1 e com cartão escolhido, cria parcelas mês a mês.
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={onClose}>Cancelar</button>
            <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "white" }} type="submit">
              Salvar
            </button>
          </div>
        </form>
      </Dialog>
    );
  }

  function TransferModal({ wallets, onClose, onSubmit }) {
    const [form, setForm] = useState({
      fromWalletId: wallets[0]?.id || "",
      toWalletId: wallets[1]?.id || "",
      amount: "",
      dateISO: DateTime.now().toISO(),
      desc: "Transferência",
    });
    return (
      <Dialog open={true} onClose={onClose} title="Transferência entre contas">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form }); }}>
          <Select label="De" value={form.fromWalletId} onChange={(v) => setForm(p => ({ ...p, fromWalletId: v }))} options={wallets.map(w => ({ value: w.id, label: w.name }))} />
          <Select label="Para" value={form.toWalletId} onChange={(v) => setForm(p => ({ ...p, toWalletId: v }))} options={wallets.filter(w => w.id !== form.fromWalletId).map(w => ({ value: w.id, label: w.name }))} />
          <label className="grid gap-1 text-sm">
            <span>Valor</span>
            <input className="input" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Data</span>
            <input type="datetime-local" className="input" value={form.dateISO.slice(0, 16)} onChange={(e) => setForm(p => ({ ...p, dateISO: new Date(e.target.value).toISOString() }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Descrição</span>
            <input className="input" value={form.desc} onChange={(e) => setForm(p => ({ ...p, desc: e.target.value }))} />
          </label>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={onClose}>Cancelar</button>
            <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "white" }} type="submit">Transferir</button>
          </div>
        </form>
      </Dialog>
    );
  }

  function BillModal({ categories, onClose, onSubmit }) {
    const [form, setForm] = useState({
      title: "",
      kind: "pay", // pay | receive
      amount: "",
      dueISO: DateTime.now().toISODate(),
      category: "",
      rrule: "",
      notes: "",
    });

    return (
      <Dialog open={true} onClose={onClose} title="Nova conta">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount || 0) }); }}>
          <label className="grid gap-1 text-sm">
            <span>Título</span>
            <input className="input" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex.: Aluguel, Salário, Internet…" />
          </label>
          <div className="grid md:grid-cols-3 gap-2">
            <Select label="Tipo" value={form.kind} onChange={(v) => setForm(p => ({ ...p, kind: v }))} options={[
              { value: "pay", label: "Pagar" }, { value: "receive", label: "Receber" }
            ]} />
            <label className="grid gap-1 text-sm">
              <span>Valor</span>
              <input className="input" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Vencimento</span>
              <input type="date" className="input" value={form.dueISO} onChange={(e) => setForm(p => ({ ...p, dueISO: e.target.value }))} />
            </label>
          </div>
          <Select label="Categoria" value={form.category} onChange={(v) => setForm(p => ({ ...p, category: v }))} options={[{ value: "", label: "—" }, ...categories.map(c => ({ value: c, label: c }))]} />
          <label className="grid gap-1 text-sm">
            <span>Recorrência (RRULE opcional)</span>
            <input className="input" placeholder="RRULE:FREQ=MONTHLY;INTERVAL=1" value={form.rrule} onChange={(e) => setForm(p => ({ ...p, rrule: e.target.value }))} />
            <small className="text-[var(--pc-muted)]">Ex.: mensal, anual, quinzenal (podemos gerar via editor depois)</small>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Notas</span>
            <textarea className="input" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
          </label>

          <div className="flex justify-end gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={onClose}>Cancelar</button>
            <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "white" }} type="submit">Salvar</button>
          </div>
        </form>
      </Dialog>
    );
  }

  function CategoryModal({ categories, onAdd, onRemove, onClose }) {
    const [name, setName] = useState("");
    return (
      <Dialog open={true} onClose={onClose} title="Categorias">
        <div className="grid gap-3">
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
            {categories.map((c) => (
              <div key={c} className="flex items-center justify-between rounded-lg border border-[var(--pc-border)] px-3 py-2">
                <span className="text-sm">{c}</span>
                {!FINANCE_CATEGORIES.includes(c) && (
                  <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => onRemove(c)}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input className="input w-full" placeholder="Nova categoria…" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-outline" onClick={() => { onAdd(name); setName(""); }}>+ Adicionar</button>
          </div>
          <div className="flex justify-end">
            <button className="rounded-md border px-3 py-2 text-sm" onClick={onClose}>Concluir</button>
          </div>
        </div>
      </Dialog>
    );
  }

  function PiggyModal({ piggy, onSave, onAdd, onClose }) {
    const [goal, setGoal] = useState(piggy.goal);
    const [add, setAdd] = useState("");
    return (
      <Dialog open={true} onClose={onClose} title="Cofrinho (meta)">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Meta (R$)</span>
            <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => onSave({ ...piggy, goal: Number(goal || 0) })}>Salvar meta</button>
            <div className="text-sm text-[var(--pc-muted)]">Atual: {formatBRL(piggy.goal)}</div>
          </div>
          <div className="grid gap-1 text-sm">
            <span>Adicionar ao cofrinho</span>
            <div className="flex gap-2">
              <input className="input w-full" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="0,00" />
              <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "white" }} onClick={() => { onAdd(Number(add || 0)); setAdd(""); }}>
                Adicionar
              </button>
            </div>
            <div className="text-sm text-[var(--pc-muted)]">Acumulado: <b>{formatBRL(piggy.saved)}</b> / Meta: <b>{formatBRL(piggy.goal)}</b></div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-md border px-3 py-2 text-sm" onClick={onClose}>Concluir</button>
          </div>
        </div>
      </Dialog>
    );
  }

  // ============ TABS ============

  const tabs = [
    { id: "dash", label: "Dashboard", content: <Dashboard /> },
    { id: "wallets", label: "Carteiras & Bancos", content: <WalletsAndCards /> },
    { id: "tx", label: "Lançamentos", content: <Transactions /> },
    { id: "bills", label: "Contas a pagar/receber", content: <Bills /> },
    { id: "budget", label: "Orçamentos & Metas", content: <Budgets /> },
    { id: "reports", label: "Relatórios", content: <Reports /> },
  ];

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
        <Tabs tabs={tabs} />
      </div>
      <ModalSwitch />
    </div>
  );
}