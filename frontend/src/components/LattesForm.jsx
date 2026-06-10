import { RoleSelector } from './Selector/RoleSelector';

export default function LattesForm({
  buscarLattes, searchType, setSearchType, isAeriSelected, 
  aeriEntryYear, setAeriEntryYear, currentYear, url, setUrl, loading, status
}) {
  return (
    <section className="panel form-panel">
      <form onSubmit={buscarLattes}>
        <div>
          <RoleSelector value={searchType} setValue={setSearchType} />

          {isAeriSelected && (
            <div className="aeri-input-group">
              <label htmlFor="aeri-entry-year">Insira o ano de entrada na UEFS</label>
              <input
                id="aeri-entry-year"
                type="number"
                value={aeriEntryYear}
                onChange={(e) => setAeriEntryYear(e.target.value)}
                placeholder="Ex: 2020"
                min={1900}
                max={currentYear}
              />
            </div>
          )}

          <label htmlFor="lattes-url" className={isAeriSelected ? 'lattes-url-label-with-spacing' : ''}>
            URL completa ou código do currículo Lattes
          </label>
          <div className="input-row">
            <input
              id="lattes-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://lattes.cnpq.br/(ID Lattes) ou ID Lattes"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </div>
        <p className="helper-text">Informe a URL completa ou o código público do currículo Lattes.</p>
        
        {status.message && (
          <div className={`status visible ${status.type}`} aria-live="polite">
            {status.message}
          </div>
        )}
      </form>
    </section>
  );
}