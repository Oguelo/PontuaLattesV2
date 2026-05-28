import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SummaryCards from './components/SummaryCards';
import ChartsPanels from './components/ChartsPanels';
import HistoryTable from './components/HistoryTable';
import DashboardFooter from './components/DashboardFooter';

const ITENS_POR_PAGINA = 10;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [resumo, setResumo] = useState(null);
  const [consultasPorDia, setConsultasPorDia] = useState([]);
  const [topNomes, setTopNomes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const token = useMemo(() => localStorage.getItem('auth_token'), []);

  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=dashboard.html', { replace: true });
      return;
    }

    async function carregarDashboard() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [consultasRes, resumoRes, topRes, diaRes] = await Promise.all([
          api.get(`/consultas?page=${paginaAtual}&per_page=${ITENS_POR_PAGINA}`, { headers }),
          api.get('/consultas/resumo', { headers }),
          api.get('/consultas/top5', { headers }),
          api.get('/consultas/dia', { headers }),
        ]);

        setConsultas(consultasRes.data?.consultas || []);
        setTotalPaginas(consultasRes.data?.total_pages || 1);
        setResumo(resumoRes.data || { total: 0, sucessos: 0, falhas: 0 });
        setTopNomes(topRes.data?.dados || []);
        setConsultasPorDia(diaRes.data?.dados || []);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login?redirect=dashboard.html', { replace: true });
          return;
        }

        setResumo({ total: 0, sucessos: 0, falhas: 0 });
        setTopNomes([]);
        setConsultasPorDia([]);
        setConsultas([]);
      }
    }

    carregarDashboard();
  }, [navigate, paginaAtual, token]);

  function onPageChange(pagina) {
    if (pagina < 1 || pagina > totalPaginas) {
      return;
    }

    setPaginaAtual(pagina);
  }

  return (
    <main className="page">
      <section className="hero">
        <span className="hero-badge">Painel Administrativo</span>
        <h1>Dashboard de Acessos</h1>
        <p className="hero-lead">Monitoramento das consultas realizadas no sistema.</p>
        <div className="hero-meta">
          <Link className="hero-link" to="/">Voltar</Link>
        </div>
      </section>

      <SummaryCards resumo={resumo} />
      <ChartsPanels consultasPorDia={consultasPorDia} resumo={resumo} topNomes={topNomes} />
      <HistoryTable
        consultas={consultas}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPageChange={onPageChange}
      />
      <DashboardFooter />
    </main>
  );
}
