function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

function getMaximumAllowedLabel(title, titulacao) {
  if (title === 'I - Titulacao') {
    const nivelMaximo = titulacao?.nivel_maximo || 'Nao identificado';

    if (nivelMaximo === 'Doutorado') return '12';
    if (nivelMaximo === 'Mestrado') return '8';

    return '12 (Doutorado) ou 8 (Mestrado)';
  }

  if (title === 'II - Producao') return '30';
  if (title === 'III - Formacao de recursos humanos') return '12';
  if (title === 'IV - Participacao em eventos/comite') return '6';

  return '-';
}

function getMaximumAllowedLabelFromLimit(section) {
  if (section?.limite === 0) return '0';
  if (!section?.limite) return '-';
  return formatNumber(section.limite);
}

function buildTitulationSection(titulacao) {
  const nivelMaximo = titulacao?.nivel_maximo || 'Nao identificado';
  const isDoutorado = nivelMaximo === 'Doutorado';
  const isMestrado = nivelMaximo === 'Mestrado';

  return {
    itens: {
      Doutorado: {
        quantidade: isDoutorado ? 1 : 0,
        peso: 12,
        pontos: isDoutorado ? 12 : 0,
      },
      Mestrado: {
        quantidade: isMestrado ? 1 : 0,
        peso: 8,
        pontos: isMestrado ? 8 : 0,
      },
    },
    subtotal_bruto: titulacao?.subtotal_bruto || 0,
    subtotal_limitado: titulacao?.subtotal_limitado || 0,
  };
}

function BaremaSection({ title, section, maximumAllowedLabel, note }) {
  const safeSection = section || {};
  const itens = Object.entries(safeSection.itens || {});

  return (
    <div className="barema-card">
      <div className="barema-card-header">
        <h3>{title}</h3>
        <div className="barema-card-total">
          <span>Pontuacao encontrada: {formatNumber(safeSection.subtotal_bruto)}</span>
          <span>Maximo permitido: {maximumAllowedLabel}</span>
        </div>
      </div>

      {itens.length > 0 ? (
        <div className="barema-table-wrapper">
          <table className="barema-table">
            <thead>
              <tr>
                <th>Criterio</th>
                <th>Qtd.</th>
                <th>Peso</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(([label, item]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{formatNumber(item.quantidade)}</td>
                  <td>{formatNumber(item.peso)}</td>
                  <td>{formatNumber(item.pontos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="barema-empty">Sem itens detalhados.</p>
      )}

      {note && <p className="barema-empty">{note}</p>}
    </div>
  );
}

function BaremaObservations({ observacoes }) {
  if (!observacoes || observacoes.length === 0) {
    return null;
  }

  return (
    <div className="barema-observations">
      <h3>Observacoes</h3>
      <ul className="details-list">
        {observacoes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function BaremaCardProfessor({ barema }) {
  const observacoes = barema.observacoes || [];

  return (
    <>
      <div className="barema-summary">
        <div className="barema-highlight-grid">
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Titulacao</span>
            <strong>{formatNumber(barema.titulacao?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Producao</span>
            <strong>{formatNumber(barema.producao?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Formacao RH</span>
            <strong>{formatNumber(barema.formacao_recursos_humanos?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Eventos/comite</span>
            <strong>{formatNumber(barema.participacao_eventos_comite?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item barema-highlight-total">
            <span className="barema-highlight-label">Total final</span>
            <strong>{formatNumber(barema.total_limitado)}</strong>
          </div>
        </div>
      </div>

      <div className="barema-sections">
        <BaremaSection
          title="I - Titulacao"
          section={buildTitulationSection(barema.titulacao || {})}
          maximumAllowedLabel={getMaximumAllowedLabel('I - Titulacao', barema.titulacao || {})}
        />
        <BaremaSection
          title="II - Producao"
          section={barema.producao || {}}
          maximumAllowedLabel={getMaximumAllowedLabel('II - Producao', barema.titulacao || {})}
        />
        <BaremaSection
          title="III - Formacao de recursos humanos"
          section={barema.formacao_recursos_humanos || {}}
          maximumAllowedLabel={getMaximumAllowedLabel('III - Formacao de recursos humanos', barema.titulacao || {})}
        />
        <BaremaSection
          title="IV - Participacao em eventos/comite"
          section={barema.participacao_eventos_comite || {}}
          maximumAllowedLabel={getMaximumAllowedLabel('IV - Participacao em eventos/comite', barema.titulacao || {})}
        />
      </div>

      <BaremaObservations observacoes={observacoes} />
    </>
  );
}

function BaremaCardAeri({ barema }) {
  const observacoes = barema.observacoes || [];

  const sections = [
    {
      key: 'participacao_eventos',
      title: '3.1 Participacao/organizacao em eventos',
    },
    {
      key: 'producao_cientifica',
      title: '3.2 Producao cientifica/tecnologica',
    },
    {
      key: 'lideranca_estudantil',
      title: '3.3 Representacao/lideranca estudantil',
    },
    {
      key: 'programas_academicos',
      title: '3.4 Programas academicos/estagios',
    },
  ];

  return (
    <>
      <div className="barema-summary">
        <div className="barema-highlight-grid">
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Participacao</span>
            <strong>{formatNumber(barema.participacao_eventos?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Producao cientifica</span>
            <strong>{formatNumber(barema.producao_cientifica?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Lideranca</span>
            <strong>{formatNumber(barema.lideranca_estudantil?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item">
            <span className="barema-highlight-label">Programas</span>
            <strong>{formatNumber(barema.programas_academicos?.subtotal_limitado)}</strong>
          </div>
          <div className="barema-highlight-item barema-highlight-total">
            <span className="barema-highlight-label">Total final</span>
            <strong>{formatNumber(barema.total_limitado)}</strong>
          </div>
        </div>
      </div>

      <div className="barema-sections">
        {sections.map((section) => {
          const data = barema[section.key] || {};
          const maxLabel = data?.limite === undefined || data?.limite === null
            ? '10'
            : getMaximumAllowedLabelFromLimit(data);

          return (
            <BaremaSection
              key={section.key}
              title={section.title}
              section={data}
              maximumAllowedLabel={maxLabel}
              note={data.aviso}
            />
          );
        })}
      </div>

      <BaremaObservations observacoes={observacoes} />
    </>
  );
}

export default function BaremaCard({ barema }) {
  if (!barema || !barema.success) {
    return <div className="publication-item">Barema nao disponivel.</div>;
  }

  if (barema.tipo === 'aeri') {
    return <BaremaCardAeri barema={barema} />;
  }

  return <BaremaCardProfessor barema={barema} />;
}
