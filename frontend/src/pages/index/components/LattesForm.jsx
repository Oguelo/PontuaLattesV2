export default function LattesForm({
  url,
  onUrlChange,
  onSubmit,
  loading,
  status,
  tipo,
  onTipoChange,
  dataIngresso,
  onDataIngressoChange,
}) {
  return (
    <section className="panel form-panel">
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="tipo-barema">Tipo de barema</label>
          <select
            id="tipo-barema"
            name="tipo"
            value={tipo}
            onChange={(event) => onTipoChange(event.target.value)}
          >
            <option value="professor">Professor</option>
            <option value="aeri">AERI</option>
          </select>
        </div>

        {tipo === 'aeri' && (
          <div>
            <label htmlFor="data-ingresso">Ano de ingresso na UEFS</label>
            <input
              id="data-ingresso"
              name="data_ingresso"
              type="text"
              value={dataIngresso}
              onChange={(event) => onDataIngressoChange(event.target.value)}
              placeholder="2022 ou 2022-03-15"
            />
          </div>
        )}

        <div>
          <label htmlFor="lattes-url">Codigo do curriculo Lattes (alfanumerico)</label>
          <div className="input-row">
            <input
              id="lattes-url"
              name="url"
              type="text"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://lattes.cnpq.br/(ID Lattes) ou ID Lattes"
              required
            />
            <button id="submit-button" type="submit" disabled={loading}>
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </div>
        <p className="helper-text">
          Informe o codigo alfanumerico do curriculo. Nao aceita codigo publico (somente numeros).
        </p>
        <div className={`status ${status.message ? 'visible' : ''} ${status.type}`} aria-live="polite">
          {status.message}
        </div>
      </form>
    </section>
  );
}
