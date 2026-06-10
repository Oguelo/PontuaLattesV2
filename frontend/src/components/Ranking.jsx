const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Ranking({ topPesquisas, limparHistorico, realizarConsulta }) {
  if (!topPesquisas || topPesquisas.length === 0) return null;

  return (
    <section className="panel ranking-panel">
      <div className="ranking-header">
        <h2 style={{ margin: 0 }}>Top 5 Pontuações Pesquisadas</h2>
        <button onClick={limparHistorico} className="btn-clear-ranking">
          Limpar Ranking
        </button>
      </div>
      
      <ul className="ranking-list">
        {topPesquisas.map((item, index) => (
          <li key={item.id} className={`ranking-item ${index === 0 ? 'first-place' : ''}`}>
            <div className="ranking-info">
              <span className="ranking-position">{index + 1}º</span>
              <span 
                className="ranking-name ranking-link" 
                onClick={() => realizarConsulta(item.id)}
                title={`Recalcular barema de ${item.nome}`}
              >
                {item.nome}
              </span>
            </div>
            <div className="ranking-score">
              {formatNumber(item.pontuacao)} <span className="ranking-score-label">pts</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}