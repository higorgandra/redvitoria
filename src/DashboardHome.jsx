import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle, Send, RotateCcw } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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

        // Limpa o listener quando o componente é desmontado
        return () => unsubscribe();
    }, []);

    const handleResetMetrics = async () => {
        if (window.confirm("Tem certeza que deseja ZERAR todas as métricas? Essa ação não pode ser desfeita e é ideal para início de mês/campanha.")) {
            try {
                const metricsRef = doc(db, 'metrics', 'userInteractions');
                await setDoc(metricsRef, {
                    addToCartClicks: 0,
                    whatsappClicks: 0,
                    adCardClicks: 0
                });
                // O onSnapshot atualizará o estado automaticamente
            } catch (error) {
                console.error("Erro ao resetar métricas:", error);
                alert("Erro ao resetar métricas. Verifique o console.");
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
                <button onClick={handleResetMetrics} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium" title="Zerar contadores para novo mês">
                    <RotateCcw size={16} />
                    Resetar Métricas
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<ShoppingBag size={24} className="text-gray-600" />} title="Cliques em 'Adicionar à Sacola'" value={loading ? '...' : metrics.addToCartClicks || 0} description="Total de interações no botão de adicionar produto." />
                <StatCard icon={<MessageCircle size={24} className="text-gray-600" />} title="Cliques em 'Finalizar no WhatsApp'" value={loading ? '...' : metrics.whatsappClicks || 0} description="Total de interações no botão para finalizar via WhatsApp." />
                <StatCard icon={<Send size={24} className="text-gray-600" />} title="Cliques no Catálogo (Anúncio)" value={loading ? '...' : metrics.adCardClicks || 0} description="Total de cliques no card de anúncio para o catálogo." />
            </div>
        </div>
    );
};

export default DashboardHome;