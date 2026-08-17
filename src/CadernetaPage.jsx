import React, { useState, useEffect, useMemo } from 'react';
import {
  NotebookPen, PlusCircle, Search, ChevronDown, MessageCircle, Wallet,
  AlertTriangle, CheckCircle, Users, HandCoins, Pencil, Trash2, X,
  AlertCircle, RotateCcw, Loader2
} from 'lucide-react';
import { db } from './firebase';
import {
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { useBodyScrollLock } from './useBodyScrollLock';

// ---------- Helpers puros ----------

// Data local de hoje no formato YYYY-MM-DD (o input[type=date] usa esse formato).
// Montada manualmente para não sofrer o deslocamento de fuso do toISOString().
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas são guardadas como string YYYY-MM-DD; a conversão por split evita o
// bug clássico de `new Date('2026-08-17')` cair no dia anterior por causa do UTC.
const formatDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

const round2 = (n) => Math.round(n * 100) / 100;

// Aceita vírgula como separador decimal ("12,50"), padrão brasileiro de digitação.
const parseMoney = (v) => {
  const n = parseFloat(String(v ?? '').trim().replace(',', '.'));
  return isNaN(n) ? NaN : round2(n);
};

// Remove acentos para comparar/buscar nomes (mesma técnica usada em ProductsPage).
const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const onlyDigits = (s) => (s || '').replace(/\D/g, '');

// Monta o link do WhatsApp. Números com até 11 dígitos (DDD + número) ganham o
// código do Brasil; com 12+ assume-se que o código do país já foi digitado.
const buildWaLink = (phone, text) => {
  let digits = onlyDigits(phone);
  if (!digits) return null;
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || '';

const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const emptyForm = () => ({
  clientName: '', clientPhone: '', productName: '', amount: '',
  saleDate: todayStr(), dueDate: '', note: ''
});

// ---------- Componentes visuais pequenos ----------

const SummaryCard = ({ icon, title, value, tone = 'text-gray-800' }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 text-gray-500">
      {icon}
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide">{title}</p>
    </div>
    <p className={`text-lg sm:text-2xl font-bold mt-2 ${tone}`}>{value}</p>
  </div>
);

const Badge = ({ color, children }) => (
  <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${color}`}>{children}</span>
);

// ---------- Página ----------

export default function CadernetaPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // 'permission' | 'generic' | null
  const [view, setView] = useState('aberto'); // 'aberto' | 'pago'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClients, setExpandedClients] = useState(() => new Set());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [payingEntry, setPayingEntry] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', date: todayStr() });
  const [paymentError, setPaymentError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [productNames, setProductNames] = useState([]);

  useBodyScrollLock(isFormOpen || !!payingEntry || !!deleteTarget);

  // Sincronização em tempo real: qualquer alteração feita em outro aparelho
  // (celular/computador) aparece aqui sozinha, sem botão de atualizar.
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'fiados'), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          ...data,
          amount: Number(data.amount) || 0,
          amountPaid: Number(data.amountPaid) || 0,
          payments: Array.isArray(data.payments) ? data.payments : [],
          status: data.status === 'pago' ? 'pago' : 'aberto',
        };
      });
      setEntries(list);
      setLoadError(null);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar a caderneta:', error);
      setLoadError(error?.code === 'permission-denied' ? 'permission' : 'generic');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Nomes de produtos do catálogo para o autocomplete do formulário.
  useEffect(() => {
    getDocs(collection(db, 'products')).then((snap) => {
      const names = new Set();
      snap.forEach((d) => {
        const p = d.data() || {};
        if (p.name && p.status !== 'Anúncio') names.add(p.name);
      });
      setProductNames(Array.from(names).sort((a, b) => a.localeCompare(b)));
    }).catch(() => { /* autocomplete é opcional; sem ele o campo segue livre */ });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const today = todayStr();
  const isOverdue = (e) => e.status === 'aberto' && !!e.dueDate && e.dueDate < today;
  const remainingOf = (e) => Math.max(0, round2(e.amount - e.amountPaid));
  const lastPaymentDate = (e) => (e.payments.length ? e.payments[e.payments.length - 1].date : e.saleDate || '');

  // Índice de clientes conhecidos (para autocomplete e preencher o WhatsApp sozinho).
  const clientsIndex = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const key = normalize(e.clientName);
      if (!key) return;
      const existing = map.get(key);
      if (!existing) map.set(key, { name: e.clientName.trim(), phone: e.clientPhone || '' });
      else if (!existing.phone && e.clientPhone) existing.phone = e.clientPhone;
    });
    return map;
  }, [entries]);

  const stats = useMemo(() => {
    let open = 0, overdue = 0, received = 0;
    const debtors = new Set();
    entries.forEach((e) => {
      received += e.amountPaid;
      if (e.status === 'aberto') {
        const rest = remainingOf(e);
        open += rest;
        debtors.add(normalize(e.clientName));
        if (isOverdue(e)) overdue += rest;
      }
    });
    return { open: round2(open), overdue: round2(overdue), received: round2(received), debtors: debtors.size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, today]);

  const openCount = useMemo(() => entries.filter((e) => e.status === 'aberto').length, [entries]);
  const paidCount = entries.length - openCount;

  // Agrupamento por cliente (aba "Em aberto"), do maior devedor para o menor.
  const clientGroups = useMemo(() => {
    const q = normalize(searchQuery);
    const map = new Map();
    entries.filter((e) => e.status === 'aberto').forEach((e) => {
      if (q && !normalize(e.clientName).includes(q) && !normalize(e.productName).includes(q)) return;
      const key = normalize(e.clientName) || 'sem-nome';
      if (!map.has(key)) {
        map.set(key, { key, name: e.clientName?.trim() || 'Sem nome', phone: e.clientPhone || '', entries: [], total: 0, overdueCount: 0 });
      }
      const g = map.get(key);
      g.entries.push(e);
      g.total = round2(g.total + remainingOf(e));
      if (!g.phone && e.clientPhone) g.phone = e.clientPhone;
      if (isOverdue(e)) g.overdueCount++;
    });
    const groups = Array.from(map.values());
    groups.forEach((g) => g.entries.sort((a, b) => (a.saleDate || '').localeCompare(b.saleDate || '')));
    groups.sort((a, b) => b.total - a.total);
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, searchQuery, today]);

  const paidEntries = useMemo(() => {
    const q = normalize(searchQuery);
    return entries
      .filter((e) => e.status === 'pago')
      .filter((e) => !q || normalize(e.clientName).includes(q) || normalize(e.productName).includes(q))
      .sort((a, b) => lastPaymentDate(b).localeCompare(lastPaymentDate(a)));
  }, [entries, searchQuery]);

  // ---------- Ações ----------

  const toggleClient = (key) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openNewForm = () => {
    setEditingEntry(null);
    setFormData(emptyForm());
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (entry) => {
    setEditingEntry(entry);
    setFormData({
      clientName: entry.clientName || '',
      clientPhone: entry.clientPhone || '',
      productName: entry.productName || '',
      amount: entry.amount ? String(entry.amount.toFixed(2)).replace('.', ',') : '',
      saleDate: entry.saleDate || todayStr(),
      dueDate: entry.dueDate || '',
      note: entry.note || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Se escolheu uma cliente que já existe e o WhatsApp está vazio, preenche sozinho.
      if (name === 'clientName' && !prev.clientPhone) {
        const known = clientsIndex.get(normalize(value));
        if (known?.phone) next.clientPhone = known.phone;
      }
      return next;
    });
  };

  const handleSaveEntry = async () => {
    const errors = {};
    const amount = parseMoney(formData.amount);
    if (!formData.clientName.trim()) errors.clientName = 'Informe o nome da cliente.';
    if (!formData.productName.trim()) errors.productName = 'Informe o produto.';
    if (isNaN(amount) || amount <= 0) errors.amount = 'Informe um valor maior que zero.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingEntry) {
        // Se o valor editado ficou menor ou igual ao que já foi pago, a dívida quita sozinha.
        const status = editingEntry.amountPaid >= amount - 0.004 ? 'pago' : 'aberto';
        await updateDoc(doc(db, 'fiados', editingEntry.id), {
          clientName: formData.clientName.trim(),
          clientPhone: formData.clientPhone.trim(),
          productName: formData.productName.trim(),
          amount,
          saleDate: formData.saleDate || todayStr(),
          dueDate: formData.dueDate || null,
          note: formData.note.trim(),
          status,
          updatedAt: serverTimestamp(),
        });
        setToast({ type: 'success', message: 'Anotação atualizada!' });
      } else {
        await addDoc(collection(db, 'fiados'), {
          clientName: formData.clientName.trim(),
          clientPhone: formData.clientPhone.trim(),
          productName: formData.productName.trim(),
          amount,
          amountPaid: 0,
          payments: [],
          status: 'aberto',
          saleDate: formData.saleDate || todayStr(),
          dueDate: formData.dueDate || null,
          note: formData.note.trim(),
          createdAt: serverTimestamp(),
        });
        setToast({ type: 'success', message: 'Compra anotada na caderneta!' });
        setExpandedClients((prev) => new Set(prev).add(normalize(formData.clientName)));
        setView('aberto');
      }
      closeForm();
    } catch (err) {
      console.error('Erro ao salvar anotação:', err);
      setToast({ type: 'error', message: 'Não foi possível salvar. Tente de novo.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openPayment = (entry) => {
    const rest = remainingOf(entry);
    setPayingEntry(entry);
    setPaymentData({ amount: rest.toFixed(2).replace('.', ','), date: todayStr() });
    setPaymentError('');
  };

  const handleSavePayment = async () => {
    if (!payingEntry) return;
    const rest = remainingOf(payingEntry);
    const value = parseMoney(paymentData.amount);
    if (isNaN(value) || value <= 0) {
      setPaymentError('Informe um valor maior que zero.');
      return;
    }
    if (value > rest + 0.005) {
      setPaymentError(`O valor não pode passar do que falta (${formatBRL(rest)}).`);
      return;
    }

    setIsSaving(true);
    try {
      const newPaid = round2(payingEntry.amountPaid + value);
      const paidOff = newPaid >= payingEntry.amount - 0.004;
      await updateDoc(doc(db, 'fiados', payingEntry.id), {
        amountPaid: newPaid,
        payments: [...payingEntry.payments, { amount: value, date: paymentData.date || todayStr() }],
        status: paidOff ? 'pago' : 'aberto',
        updatedAt: serverTimestamp(),
      });
      setToast({ type: 'success', message: paidOff ? 'Dívida quitada! 🎉' : 'Pagamento parcial registrado.' });
      setPayingEntry(null);
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      setToast({ type: 'error', message: 'Não foi possível registrar o pagamento.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Remove o último pagamento (para corrigir um registro errado) e reabre a dívida.
  const handleUndoPayment = async (entry) => {
    if (entry.payments.length === 0) return;
    const last = entry.payments[entry.payments.length - 1];
    const ok = window.confirm(`Desfazer o último pagamento de ${formatBRL(last.amount)} (${formatDate(last.date)})?`);
    if (!ok) return;
    try {
      const payments = entry.payments.slice(0, -1);
      const amountPaid = round2(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
      await updateDoc(doc(db, 'fiados', entry.id), {
        payments,
        amountPaid,
        status: amountPaid >= entry.amount - 0.004 ? 'pago' : 'aberto',
        updatedAt: serverTimestamp(),
      });
      setToast({ type: 'success', message: 'Pagamento desfeito.' });
    } catch (err) {
      console.error('Erro ao desfazer pagamento:', err);
      setToast({ type: 'error', message: 'Não foi possível desfazer o pagamento.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'fiados', deleteTarget.id));
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Anotação excluída.' });
    } catch (err) {
      console.error('Erro ao excluir anotação:', err);
      setToast({ type: 'error', message: 'Não foi possível excluir.' });
    }
  };

  const buildChargeMessage = (group) => {
    const lines = group.entries.map((e) => `• ${e.productName} — ${formatBRL(remainingOf(e))}`);
    return `Oi, ${firstName(group.name)}! Tudo bem? 😊\n\nPassando só pra lembrar com carinho dos valores anotados na caderneta:\n\n${lines.join('\n')}\n\nTotal: ${formatBRL(group.total)}\n\nQualquer coisa é só me chamar! 💕`;
  };

  const searching = !!searchQuery.trim();

  // ---------- Render ----------

  return (
    <div className="p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caderneta</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compras no fiado, cobranças e pagamentos</p>
        </div>
        <button onClick={openNewForm} className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white rounded-lg font-semibold shadow-sm hover:bg-[#650000] transition-colors shrink-0">
          <PlusCircle size={18} />
          <span className="hidden sm:inline">Nova Anotação</span>
          <span className="sm:hidden">Anotar</span>
        </button>
      </div>

      {loadError === 'permission' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm mb-5">
          <p className="font-semibold mb-1">A caderneta ainda não tem permissão no banco de dados.</p>
          <p>Publique as regras do Firestore (arquivo <code className="bg-yellow-100 px-1 rounded">firestore.rules</code>) com <code className="bg-yellow-100 px-1 rounded">firebase deploy --only firestore:rules</code> e recarregue esta página.</p>
        </div>
      )}
      {loadError === 'generic' && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-5">
          Não foi possível carregar a caderneta. Verifique sua conexão e recarregue a página.
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <SummaryCard icon={<Wallet size={16} />} title="A Receber" value={formatBRL(stats.open)} tone="text-[#8B0000]" />
        <SummaryCard icon={<AlertTriangle size={16} />} title="Em Atraso" value={formatBRL(stats.overdue)} tone={stats.overdue > 0 ? 'text-red-600' : 'text-gray-800'} />
        <SummaryCard icon={<CheckCircle size={16} />} title="Já Recebido" value={formatBRL(stats.received)} tone="text-green-600" />
        <SummaryCard icon={<Users size={16} />} title="Clientes Devendo" value={stats.debtors} />
      </div>

      {/* Abas + busca */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setView('aberto')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${view === 'aberto' ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Em aberto ({openCount})
          </button>
          <button onClick={() => setView('pago')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${view === 'pago' ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Pagas ({paidCount})
          </button>
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
            placeholder="Buscar por cliente ou produto"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Carregando caderneta...</span>
        </div>
      ) : view === 'aberto' ? (
        clientGroups.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-gray-500">
            <NotebookPen size={32} className="mx-auto mb-3 text-gray-300" />
            {searching ? (
              <p className="text-sm">Nenhuma dívida em aberto encontrada para essa busca.</p>
            ) : (
              <>
                <p className="font-medium text-gray-600">Nenhuma compra no fiado em aberto.</p>
                <p className="text-sm mt-1">Toque em “Nova Anotação” para registrar a primeira.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {clientGroups.map((group) => {
              const isExpanded = searching || expandedClients.has(group.key);
              const waHref = buildWaLink(group.phone, buildChargeMessage(group));
              return (
                <div key={group.key} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <button onClick={() => toggleClient(group.key)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center font-bold text-sm shrink-0">
                      {initials(group.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.entries.length} {group.entries.length === 1 ? 'compra' : 'compras'}
                        {group.overdueCount > 0 && (
                          <span className="text-red-600 font-semibold"> · {group.overdueCount} em atraso</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">{formatBRL(group.total)}</p>
                      <p className="text-[11px] text-gray-400">a receber</p>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {waHref && (
                        <div className="p-3 pb-0">
                          <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors">
                            <MessageCircle size={16} /> Cobrar no WhatsApp
                          </a>
                        </div>
                      )}
                      <div className="divide-y divide-gray-100">
                        {group.entries.map((entry) => {
                          const rest = remainingOf(entry);
                          const overdue = isOverdue(entry);
                          const dueToday = entry.status === 'aberto' && entry.dueDate === today;
                          return (
                            <div key={entry.id} className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 break-words">{entry.productName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Comprado em {formatDate(entry.saleDate)}
                                    {entry.dueDate && <> · combinado p/ {formatDate(entry.dueDate)}</>}
                                  </p>
                                  {entry.note && <p className="text-xs text-gray-400 italic mt-1 break-words">{entry.note}</p>}
                                  {(overdue || dueToday || entry.amountPaid > 0) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {overdue && <Badge color="bg-red-100 text-red-800 border-red-200">Atrasado</Badge>}
                                      {dueToday && <Badge color="bg-yellow-100 text-yellow-800 border-yellow-200">Vence hoje</Badge>}
                                      {entry.amountPaid > 0 && <Badge color="bg-blue-100 text-blue-800 border-blue-200">Parcial</Badge>}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-gray-800">{formatBRL(rest)}</p>
                                  {entry.amountPaid > 0 && (
                                    <p className="text-[11px] text-green-600">pagou {formatBRL(entry.amountPaid)} de {formatBRL(entry.amount)}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <button onClick={() => openPayment(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                                  <HandCoins size={14} /> Pagamento
                                </button>
                                <button onClick={() => openEditForm(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                                  <Pencil size={14} /> Editar
                                </button>
                                {entry.amountPaid > 0 && (
                                  <button onClick={() => handleUndoPayment(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                                    <RotateCcw size={14} /> Desfazer pgto.
                                  </button>
                                )}
                                <button onClick={() => setDeleteTarget(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                  <Trash2 size={14} /> Excluir
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        paidEntries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center text-gray-500">
            <CheckCircle size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{searching ? 'Nenhuma dívida paga encontrada para essa busca.' : 'Nenhuma dívida quitada ainda.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paidEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{entry.clientName || 'Sem nome'}</p>
                    <p className="text-sm text-gray-600 break-words">{entry.productName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Comprado em {formatDate(entry.saleDate)}
                      {entry.payments.length > 0 && <> · quitado em {formatDate(lastPaymentDate(entry))}</>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-green-600">{formatBRL(entry.amount)}</p>
                    <Badge color="bg-green-100 text-green-800 border-green-200">Pago</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {entry.payments.length > 0 && (
                    <button onClick={() => handleUndoPayment(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                      <RotateCcw size={14} /> Reabrir
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: nova anotação / edição */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{editingEntry ? 'Editar Anotação' : 'Nova Anotação'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cliente <span className="text-red-500">*</span></label>
                <input
                  type="text" name="clientName" list="caderneta-clientes" value={formData.clientName} onChange={handleFormChange}
                  className={`w-full p-2.5 border rounded-lg ${formErrors.clientName ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Nome da cliente" autoComplete="off"
                />
                <datalist id="caderneta-clientes">
                  {Array.from(clientsIndex.values()).map((c) => <option key={c.name} value={c.name} />)}
                </datalist>
                {formErrors.clientName && <p className="text-xs text-red-600 mt-1">{formErrors.clientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">WhatsApp <span className="text-gray-400 font-normal">(opcional, usado para cobrar)</span></label>
                <input
                  type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleFormChange}
                  className="w-full p-2.5 border border-gray-200 rounded-lg" placeholder="(71) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Produto <span className="text-red-500">*</span></label>
                <input
                  type="text" name="productName" list="caderneta-produtos" value={formData.productName} onChange={handleFormChange}
                  className={`w-full p-2.5 border rounded-lg ${formErrors.productName ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Ex: Kaiak Aventura 100ml" autoComplete="off"
                />
                <datalist id="caderneta-produtos">
                  {productNames.map((n) => <option key={n} value={n} />)}
                </datalist>
                {formErrors.productName && <p className="text-xs text-red-600 mt-1">{formErrors.productName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Valor (R$) <span className="text-red-500">*</span></label>
                  <input
                    type="text" inputMode="decimal" name="amount" value={formData.amount} onChange={handleFormChange}
                    className={`w-full p-2.5 border rounded-lg ${formErrors.amount ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Ex: 89,90"
                  />
                  {formErrors.amount && <p className="text-xs text-red-600 mt-1">{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Data da compra</label>
                  <input type="date" name="saleDate" value={formData.saleDate} onChange={handleFormChange} className="w-full p-2.5 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Combinado para pagar em <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleFormChange} className="w-full p-2.5 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Observação <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea name="note" value={formData.note} onChange={handleFormChange} rows="2" className="w-full p-2.5 border border-gray-200 rounded-lg" placeholder="Ex: vai pagar metade dia 5" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-lg">
              <button onClick={closeForm} className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSaveEntry} className="px-4 py-2 bg-[#8B0000] text-white rounded-lg font-semibold hover:bg-[#650000] transition-colors flex items-center gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (editingEntry ? 'Salvar Alterações' : 'Anotar Compra')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: registrar pagamento */}
      {payingEntry && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPayingEntry(null)} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-sm w-full">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Registrar Pagamento</h3>
              <p className="text-sm text-gray-500 mt-1 break-words">
                {payingEntry.clientName} · {payingEntry.productName}
              </p>
              <p className="text-sm font-semibold text-[#8B0000] mt-1">Falta pagar: {formatBRL(remainingOf(payingEntry))}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Valor pago (R$)</label>
                <input
                  type="text" inputMode="decimal" value={paymentData.amount}
                  onChange={(e) => { setPaymentData((prev) => ({ ...prev, amount: e.target.value })); setPaymentError(''); }}
                  className={`w-full p-2.5 border rounded-lg ${paymentError ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Ex: 50,00"
                />
                {paymentError && <p className="text-xs text-red-600 mt-1">{paymentError}</p>}
                <button
                  onClick={() => { setPaymentData((prev) => ({ ...prev, amount: remainingOf(payingEntry).toFixed(2).replace('.', ',') })); setPaymentError(''); }}
                  className="mt-2 text-xs font-semibold text-[#8B0000] hover:underline"
                >
                  Usar valor total ({formatBRL(remainingOf(payingEntry))})
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Data do pagamento</label>
                <input
                  type="date" value={paymentData.date}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-lg">
              <button onClick={() => setPayingEntry(null)} className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSavePayment} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="bg-white rounded-lg shadow-lg z-10 max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Excluir anotação</h3>
            <p className="text-sm text-gray-600 mb-4">
              Excluir a compra de <span className="font-semibold">{deleteTarget.productName}</span> de{' '}
              <span className="font-semibold">{deleteTarget.clientName}</span>? Essa ação é permanente e apaga também o histórico de pagamentos.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 left-4 sm:left-auto pb-safe px-5 py-3 rounded-lg shadow-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
