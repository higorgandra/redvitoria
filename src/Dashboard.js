import React, { useState, useEffect } from 'react';
import { getMetrics } from '../firebase'; // Ajuste o caminho se necessário

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ interactions: {}, visits: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Falha ao carregar métricas no componente:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []); // O array vazio garante que a busca ocorra apenas uma vez

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  const { interactions, visits } = metrics;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard de Métricas</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>Resumo de Interações</h2>
        <p>Cliques no WhatsApp: <strong>{interactions.whatsappClicks || 0}</strong></p>
        <p>Cliques em "Adicionar ao Carrinho": <strong>{interactions.addToCartClicks || 0}</strong></p>
        <p>Cliques nos Cards de Anúncio: <strong>{interactions.adCardClicks || 0}</strong></p>
      </div>

      <div>
        <h2>Histórico de Visitas (Total: {visits.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Data</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Cidade</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>País</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(visit => (
              <tr key={visit.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{visit.timestamp ? new Date(visit.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{visit.city}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{visit.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;