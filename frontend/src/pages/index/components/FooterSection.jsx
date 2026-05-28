import { Link } from 'react-router-dom';

export default function FooterSection() {
  return (
    <footer className="footer panel">
      <div className="footer-grid">
        <div>
          <h2>Desenvolvedores:</h2>
          <p>Abel Galvao, Alex Junior e Bruno Campos</p>

          <h2 style={{ marginTop: 24 }}>Agradecimentos:</h2>
          <p>
            Ao professor <a href="http://lattes.cnpq.br/3569271948805982" target="_blank" rel="noopener noreferrer">Mirco Ragni</a>
            {' '}por fornecer a ideia por tras para a coleta de dados do Lattes.
          </p>

          <p className="footer-note">
            <Link className="footer-subtle-link" to="/login?redirect=dashboard.html">
              Historico de consultas
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
