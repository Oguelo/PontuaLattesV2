import BaremaCard from './BaremaCard';

const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

// --- Funções Auxiliares para a Lista de Publicações ---
function getDefaultBaremaYear() {
  return new Date().getFullYear() - 5;
}

function getCurrentBaremaYear() {
  return new Date().getFullYear();
}

function resolveAnoMinimo(barema) {
  const parsed = Number(barema?.ano_minimo_considerado);

  if (barema?.tipo === 'aeri' && Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return getDefaultBaremaYear();
}

function getFilteredPublicationSeries(publicacoes, anoMinimo) {
  const series = publicacoes?.series || [];

  return series
    .map((item) => {
      const entries = Object.entries(item.por_ano || {})
        .filter(([ano]) => Number.isInteger(Number(ano)) && Number(ano) >= anoMinimo)
        .sort((a, b) => Number(a[0]) - Number(b[0]));

      const porAno = Object.fromEntries(entries);
      const total = entries.reduce((acc, [, valor]) => acc + Number(valor || 0), 0);

      return {
        ...item,
        por_ano: porAno,
        total,
      };
    })
    .filter((item) => item.total > 0);
}
// ---------------------------------------------------------

export default function Results({ resultado }) {
  if (!resultado || !resultado.barema) return null;

  // Variáveis necessárias para calcular a janela de tempo das publicações
  const barema = resultado.barema;
  const publicacoes = resultado.publicacoes || {};
  const anoMinimo = resolveAnoMinimo(barema);
  const anoAtual = getCurrentBaremaYear();
  
  // Calcula e filtra a lista de publicações
  const seriesPeriodo = getFilteredPublicationSeries(publicacoes, anoMinimo);

  return (
    <section id="results" className="results visible">
      <div className="summary">
        <article className="panel stat-card">
          <h2>Total do barema</h2>
          <div className="stat-value">{formatNumber(barema.total_limitado)}</div>
          <div className="stat-label">
            Pontuação máxima: {barema.tipo === 'aeri' ? '40' : '60'} pontos
          </div>
        </article>
        <article className="panel stat-card">
          <h2>Total de publicações</h2>
          <div className="stat-value">{publicacoes?.total_geral || 0}</div>
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
    
      <BaremaCard barema={barema} />

            <article className="panel details-card">
        <h2 id="publications-title">Publicações de {anoMinimo} a {anoAtual}</h2>
        <div id="publication-list" className="publication-list">
          {seriesPeriodo.length === 0 && (
            <div className="publication-item">Nenhuma publicação encontrada entre {anoMinimo} e {anoAtual}.</div>
          )}
          {seriesPeriodo.map((item) => {
            // Filtra os anos com > 0 publicações antes de formatar o texto
            const porAno = Object.entries(item.por_ano || {})
              .filter(([ano, valor]) => Number(valor) > 0)
              .map(([ano, valor]) => `${ano}: ${valor}`)
              .join(' • ');

            return (
              <div className="publication-item" key={item.nome}>
                <strong>{item.nome}</strong>
                <div>Total: {item.total}</div>
                <div>{porAno || 'Sem detalhamento anual.'}</div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}