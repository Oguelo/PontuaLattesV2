export default function DashboardFooter() {
  return (
    <footer className="footer panel">
      <div className="footer-section">
        <h2>Desenvolvedores</h2>
        <p>Abel Galvao, Alex Junior e Bruno Campos</p>
      </div>

      <hr className="footer-divider" />

      <div className="footer-section">
        <h2>Links Oficiais</h2>
        <p>
          Ver no sistema oficial:{' '}
          <a href="http://www.bi.cnpq.br/painel/formacao-atuacao-lattes/" target="_blank" className="footer-link" rel="noreferrer">
            Plataforma Lattes
          </a>
        </p>
      </div>
    </footer>
  );
}
