import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend);

export default function ChartsPanels({ consultasPorDia, resumo, topNomes }) {
  const labelsDia = consultasPorDia.map((item) => item.dia);
  const valoresDia = consultasPorDia.map((item) => item.total);

  const lineData = {
    labels: labelsDia,
    datasets: [
      {
        label: 'Consultas por Dia',
        data: valoresDia,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const statusData = {
    labels: ['Sucesso', 'Erro'],
    datasets: [{ data: [resumo?.sucessos || 0, resumo?.falhas || 0] }],
  };

  const barData = {
    labels: topNomes.map((item) => item.nome),
    datasets: [{ label: 'Consultas com Sucesso', data: topNomes.map((item) => item.total) }],
  };

  return (
    <>
      <section className="panel info-panel">
        <h2>Acessos por Dia</h2>
        <div className="chart-box">
          <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </section>

      <section className="panel info-panel">
        <h2>Status das Consultas</h2>
        <div className="chart-box">
          <Doughnut data={statusData} />
        </div>
      </section>

      <section className="panel info-panel">
        <h2>Ranking de Nomes Pesquisados</h2>
        <div className="chart-box">
          <Bar data={barData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }} />
        </div>
      </section>
    </>
  );
}
