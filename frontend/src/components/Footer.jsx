export default function Footer() {
  return (
    <footer className="footer panel">
      <div className="footer-grid">
        <div>
          <h2>Desenvolvedores:</h2>
          <p>
            <a className="soft-link" href="https://github.com/argalvao" target="_blank" rel="noopener noreferrer">Abel Galvão</a>,{' '}
            <a className="soft-link" href="https://github.com/Oguelo" target="_blank" rel="noopener noreferrer">Alex Júnior</a> e{' '}
            <a className="soft-link" href="https://github.com/BRCZ1N" target="_blank" rel="noopener noreferrer">Bruno Campos</a>
          </p>
          <h2 style={{ marginTop: '24px' }}>Agradecimentos:</h2>
          <p>Ao professor Mirco Ragni por fornecer a ideia por trás para a coleta de dados do Lattes.</p>
        </div>
      </div>
    </footer>
  );
}