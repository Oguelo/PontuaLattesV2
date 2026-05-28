import BaremaCard from './BaremaCard';

function getDefaultBaremaYear() {
  return new Date().getFullYear() - 5;
}

function getCurrentBaremaYear() {
  return new Date().getFullYear();
}

function getIndicadoresPublicacaoUrl(code) {
  const value = String(code ?? '').trim();

  if (!value) return '-';

  return `http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript=${encodeURIComponent(value)}`;
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

export default function ResultsSection({ resultado }) {
  if (!resultado) {
    return <section id="results" className="results" />;
  }

  const barema = resultado.barema || {};
  const tipo = barema?.tipo || 'professor';
  const anoMinimo = resolveAnoMinimo(barema);
  const anoAtual = getCurrentBaremaYear();
  const publicacoes = resultado.publicacoes || {};
  const seriesPeriodo = getFilteredPublicationSeries(publicacoes, anoMinimo);

  const anosLimpos = (publicacoes.anos || [])
    .map((ano) => String(ano).trim())
    .filter((ano) => ano !== '' && !Number.isNaN(Number(ano)) && Number(ano) >= anoMinimo);

  const totalMaximoLabel = tipo === 'aeri' ? '40 pontos' : '60 pontos';
  const tituloBarema = tipo === 'aeri' ? 'Barema AERI' : 'Barema docente';

  return (
    <section id="results" className="results visible">
      <div className="summary">
        <article className="panel stat-card">
          <h2>Total do barema</h2>
          <div id="stat-barema-total" className="stat-value">{barema?.total_limitado || 0}</div>
          <div className="stat-label">Pontuacao maxima: {totalMaximoLabel}</div>
        </article>

        <article className="panel stat-card">
          <h2>Total de publicacoes</h2>
          <div id="stat-total" className="stat-value">{publicacoes.total_geral || 0}</div>
          <div className="stat-label">Soma das series bibliograficas extraidas</div>
        </article>
      </div>

      <article className="panel details-card">
        <h2>Resumo da coleta</h2>
        <ul className="details-list" id="summary-list">
          <li><strong>Nome:</strong> {resultado.nome || 'Nao identificado'}</li>
          <li>
            <strong>Indicadores de publicacao:</strong>{' '}
            {resultado.code ? (
              <a
                className="soft-link"
                href={getIndicadoresPublicacaoUrl(resultado.code)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Link
              </a>
            ) : (
              '-'
            )}
          </li>
          <li>
            <strong>Periodo considerado ({anoMinimo} a {anoAtual}):</strong>{' '}
            {anosLimpos.join(', ') || 'Nenhum'}
          </li>
        </ul>
      </article>

      <article className="panel details-card">
        <h2 id="publications-title">Publicacoes de {anoMinimo} a {anoAtual}</h2>
        <div id="publication-list" className="publication-list">
          {seriesPeriodo.length === 0 && (
            <div className="publication-item">Nenhuma publicacao encontrada entre {anoMinimo} e {anoAtual}.</div>
          )}
          {seriesPeriodo.map((item) => {
            const porAno = Object.entries(item.por_ano || {})
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

      <article className="panel details-card">
        <h2>{tituloBarema}</h2>
        <div id="barema-summary" className="barema-summary">
          <BaremaCard barema={barema || null} />
        </div>
      </article>
    </section>
  );
}
