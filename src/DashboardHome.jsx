import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle, Send, RotateCcw, TrendingUp, DollarSign, AlertTriangle, Users } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, getCountFromServer, writeBatch } from 'firebase/firestore';

const StatCard = ({ icon, title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
);

const DashboardHome = () => {
    const [metrics, setMetrics] = useState({
        addToCartClicks: 0,
        whatsappClicks: 0,
        adCardClicks: 0, // Adiciona a nova métrica
    });
    const [loading, setLoading] = useState(true);
    const [inventoryStats, setInventoryStats] = useState({ totalValue: 0, lowStock: 0 });
    const [totalVisits, setTotalVisits] = useState(0);

    useEffect(() => {
        const metricsRef = doc(db, 'metrics', 'userInteractions');

        // onSnapshot ouve as mudanças no documento em tempo real
        const unsubscribe = onSnapshot(metricsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("✅ Métricas recebidas do Firestore:", data); // Log para confirmar leitura
                setMetrics(prevMetrics => ({
                    ...prevMetrics,
                    ...data
                }));
            } else {
                console.log("⚠️ Documento de métricas não encontrado (ainda).");
                setMetrics({ addToCartClicks: 0, whatsappClicks: 0, adCardClicks: 0 });
            }
            setLoading(false);
        }, (error) => {
            console.error("❌ Erro ao carregar métricas:", error);
            setLoading(false);
        });

        // Busca estatísticas adicionais (Produtos e Visitas)
        const fetchAdditionalStats = async () => {
            try {
                // 1. Estatísticas de Estoque
                const productsSnap = await getDocs(collection(db, 'products'));
                let value = 0;
                let low = 0;
                productsSnap.forEach(doc => {
                    const p = doc.data();
                    // Filtra apenas produtos ativos para o cálculo financeiro
                    if (p.status !== 'Arquivado' && p.status !== 'Anúncio') {
                        const price = parseFloat(p.price || 0);
                        const stock = parseInt(p.stock || 0);
                        if (stock > 0) value += price * stock;
                        if (stock <= 3) low++;
                    }
                });
                setInventoryStats({ totalValue: value, lowStock: low });

                // 2. Estatísticas de Visitas
                const visitsColl = collection(db, 'visits');
                const visitsSnapshot = await getCountFromServer(visitsColl);
                setTotalVisits(visitsSnapshot.data().count);
            } catch (error) {
                console.error("Erro ao carregar estatísticas extras:", error);
            }
        };

        fetchAdditionalStats();

        // Limpa o listener quando o componente é desmontado
        return () => unsubscribe();
    }, []);

    const handleResetMetrics = async () => {
        if (window.confirm("Tem certeza que deseja ZERAR todas as métricas? Essa ação não pode ser desfeita e é ideal para início de mês/campanha.")) {
            setLoading(true);
            try {
                // 1. Resetar contadores de cliques
                const metricsRef = doc(db, 'metrics', 'userInteractions');
                await setDoc(metricsRef, {
                    addToCartClicks: 0,
                    whatsappClicks: 0,
                    adCardClicks: 0
                });

                // 2. Resetar coleção de visitas (deletar todos os documentos)
                const visitsColl = collection(db, 'visits');
                const visitsSnapshot = await getDocs(visitsColl);
                
                // Deletar em lote (batch)
                const batch = writeBatch(db);
                visitsSnapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                setTotalVisits(0); // Atualiza o estado local imediatamente
                sessionStorage.removeItem('visit_recorded'); // Permite que o admin registre uma nova visita ao testar
                
                alert("Métricas resetadas com sucesso!");
            } catch (error) {
                console.error("Erro ao resetar métricas:", error);
                alert("Erro ao resetar métricas. Verifique o console.");
            } finally {
                setLoading(false);
            }
        }
    };

    // Cálculo da Taxa de Conversão (Sacola -> WhatsApp)
    const conversionRate = metrics.addToCartClicks > 0
        ? ((metrics.whatsappClicks / metrics.addToCartClicks) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
                <button onClick={handleResetMetrics} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium" title="Zerar contadores para novo mês">
                    <RotateCcw size={16} />
                    Resetar Métricas
                </button>
            </div>

            {/* Novos Cards Estratégicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<TrendingUp size={24} className="text-green-600" />} title="Taxa de Conversão" value={`${conversionRate}%`} description="De Sacola para WhatsApp" />
                <StatCard icon={<DollarSign size={24} className="text-blue-600" />} title="Valor em Estoque" value={`R$ ${inventoryStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} description="Potencial de venda atual" />
                <StatCard icon={<AlertTriangle size={24} className="text-yellow-600" />} title="Estoque Baixo" value={inventoryStats.lowStock} description="Produtos com < 3 un." />
                <StatCard icon={<Users size={24} className="text-purple-600" />} title="Total de Visitas" value={totalVisits} description="Acessos ao site" />
            </div>

            <h3 className="text-lg font-bold text-gray-700 mb-4">Interações em Tempo Real</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<ShoppingBag size={24} className="text-gray-600" />} title="Cliques em 'Adicionar à Sacola'" value={loading ? '...' : metrics.addToCartClicks || 0} description="Total de interações no botão de adicionar produto." />
                <StatCard icon={<MessageCircle size={24} className="text-gray-600" />} title="Cliques em 'Finalizar no WhatsApp'" value={loading ? '...' : metrics.whatsappClicks || 0} description="Total de interações no botão para finalizar via WhatsApp." />
                <StatCard icon={<Send size={24} className="text-gray-600" />} title="Cliques no Catálogo (Anúncio)" value={loading ? '...' : metrics.adCardClicks || 0} description="Total de cliques no card de anúncio para o catálogo." />
            </div>
        </div>
    );
};

export default DashboardHome;