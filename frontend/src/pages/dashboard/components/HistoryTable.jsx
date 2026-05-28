function formatarLattesUrl(consulta) {
  const candidatos = [consulta?.url_consultada, consulta?.url_informada, consulta?.code]
    .map((valor) => String(valor ?? '').trim())
    .filter(Boolean);

  for (const valor of candidatos) {
    if (/^https?:\/\//i.test(valor)) {
      return valor;
    }

    if (/^lattes\.cnpq\.br\/\d+$/i.test(valor)) {
      return `http://${valor}`;
    }

    if (/^\d+$/.test(valor)) {
      return `http://lattes.cnpq.br/${valor}`;
    }
  }

  return '-';
}

function formatarIndicadoresUrl(code) {
  const valor = String(code ?? '').trim();

  if (!valor) return '-';

  return `http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript=${encodeURIComponent(valor)}`;
}

function Pagination({ paginaAtual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) {
    return null;
  }

  const maxBotoes = 5;
  let start = Math.max(paginaAtual - Math.floor(maxBotoes / 2), 1);
  let end = start + maxBotoes - 1;

  if (end > totalPaginas) {
    end = totalPaginas;
    start = Math.max(end - maxBotoes + 1, 1);
  }

  const buttons = [];

  for (let i = start; i <= end; i += 1) {
    buttons.push(
      <button key={i} className={i === paginaAtual ? 'current' : ''} onClick={() => onChange(i)}>
        {i}
      </button>,
    );
  }

  return (
    <div id="paginacao" className="paginacao-container">
      <button onClick={() => onChange(paginaAtual - 1)} disabled={paginaAtual === 1}>‹</button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)}>1</button>
          {start > 2 && <span style={{ margin: '0 5px' }}>...</span>}
        </>
      )}
      {buttons}
      {end < totalPaginas && (
        <>
          {end < totalPaginas - 1 && <span style={{ margin: '0 5px' }}>...</span>}
          <button onClick={() => onChange(totalPaginas)}>{totalPaginas}</button>
        </>
      )}
      <button onClick={() => onChange(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>›</button>
    </div>
  );
}

export default function HistoryTable({ consultas, paginaAtual, totalPaginas, onPageChange }) {
  return (
    <section className="panel html-card">
      <h2>Historico de Consultas</h2>

      <div className="barema-table-wrapper">
        <table className="barema-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Nota</th>
              <th>LATTES</th>
              <th>Indicadores de producao</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody id="tabela-consultas">
            {consultas.length === 0 && (
              <tr>
                <td colSpan={7}>Nenhum registro encontrado.</td>
              </tr>
            )}
            {consultas.map((consulta) => {
              const lattesUrl = formatarLattesUrl(consulta);
              const indicadores = formatarIndicadoresUrl(consulta.code);

              return (
                <tr key={consulta.id}>
                  <td>{consulta.id}</td>
                  <td>{consulta.nome || '-'}</td>
                  <td>{consulta.total_limitado || '-'}</td>
                  <td>
                    {lattesUrl === '-' ? '-' : (
                      <a className="soft-link" href={lattesUrl} target="_blank" rel="noopener noreferrer">{lattesUrl}</a>
                    )}
                  </td>
                  <td>
                    {indicadores === '-' ? '-' : (
                      <a className="soft-link" href={indicadores} target="_blank" rel="noopener noreferrer">Link</a>
                    )}
                  </td>
                  <td>{consulta.success === 1 ? 'OK' : 'Falha'}</td>
                  <td>{consulta.created_at || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Pagination paginaAtual={paginaAtual} totalPaginas={totalPaginas} onChange={onPageChange} />
      </div>
    </section>
  );
}
