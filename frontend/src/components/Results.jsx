import BaremaCard from './BaremaCard';

const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Results({ resultado }) {
  if (!resultado || !resultado.barema) return null;

  return (
    <section id="results" className="results visible">
      <div className="summary">
        <article className="panel stat-card">
          <h2>Total do barema</h2>
          <div className="stat-value">{formatNumber(resultado.barema.total_limitado)}</div>
          <div className="stat-label">
            Pontuação máxima: {resultado.barema.tipo === 'aeri' ? '40' : '60'} pontos
          </div>
        </article>
        <article className="panel stat-card">
          <h2>Total de publicações</h2>
          <div className="stat-value">{resultado.publicacoes?.total_geral || 0}</div>
          <div className="stat-label">Soma das séries bibliográficas extraídas</div>
        </article>
      </div>
      
      <article className="panel details-card">
        <h2>Resumo da coleta</h2>
        <ul className="details-list">
          <li><strong>Nome:</strong> {resultado.nome || 'Não identificado'}</li>
          <li><strong>Indicadores:</strong> <a className="soft-link" href={`http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript=${resultado.code}`} target="_blank" rel="noopener noreferrer">Link</a></li>
        </ul>
      </article>
      
      <BaremaCard barema={resultado.barema} />
    </section>
  );
}