export default function SummaryCards({ resumo }) {
  const total = resumo?.total || 0;
  const sucessos = resumo?.sucessos || 0;
  const falhas = resumo?.falhas || 0;
  const taxa = total > 0 ? ((sucessos / total) * 100).toFixed(1) : '0.0';

  return (
    <section className="panel form-panel">
      <div className="summary">
        <div className="stat-card panel">
          <h2>Total</h2>
          <div className="stat-value" id="total-consultas">{total}</div>
          <div className="stat-label">Consultas realizadas</div>
        </div>

        <div className="stat-card panel">
          <h2>Sucessos</h2>
          <div className="stat-value" id="total-sucessos">{sucessos}</div>
          <div className="stat-label">Coletas bem sucedidas</div>
        </div>

        <div className="stat-card panel">
          <h2>Falhas</h2>
          <div className="stat-value" id="total-falhas">{falhas}</div>
          <div className="stat-label">Erros registrados</div>
        </div>

        <div className="stat-card panel">
          <h2>Taxa</h2>
          <div className="stat-value" id="taxa-sucesso">{taxa}%</div>
          <div className="stat-label">Taxa de sucesso</div>
        </div>
      </div>
    </section>
  );
}
