export default function LattesForm({ url, onUrlChange, onSubmit, loading, status }) {
  return (
    <section className="panel form-panel">
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="lattes-url">URL completa ou codigo do curriculo Lattes</label>
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
        <p className="helper-text">Informe a URL completa ou o codigo publico do curriculo Lattes.</p>
        <div className={`status ${status.message ? 'visible' : ''} ${status.type}`} aria-live="polite">
          {status.message}
        </div>
      </form>
    </section>
  );
}
