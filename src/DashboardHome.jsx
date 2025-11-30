import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const metricsRef = doc(db, 'metrics', 'userInteractions');

        // onSnapshot ouve as mudanças no documento em tempo real
        const unsubscribe = onSnapshot(metricsRef, (docSnap) => {
            if (docSnap.exists()) {
                setMetrics(docSnap.data());
            } else {
                console.log("Documento de métricas ainda não existe.");
            }
            setLoading(false);
        });

        // Limpa o listener quando o componente é desmontado
        return () => unsubscribe();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<ShoppingBag size={24} className="text-gray-600" />} title="Cliques em 'Adicionar à Sacola'" value={loading ? '...' : metrics.addToCartClicks} description="Total de interações no botão de adicionar produto." />
                <StatCard icon={<MessageCircle size={24} className="text-gray-600" />} title="Cliques em 'Finalizar no WhatsApp'" value={loading ? '...' : metrics.whatsappClicks} description="Total de interações no botão para finalizar via WhatsApp." />
            </div>
        </div>
    );
};

export default DashboardHome;