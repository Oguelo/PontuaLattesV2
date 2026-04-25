export default function HeroSection() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="hero">
      <span className="hero-badge">Projeto de extensao • UEFS</span>
      <h1>PontuaLattes</h1>
      <p className="hero-lead" style={{ textAlign: 'justify' }}>
        Sistema que analisa o curriculo Lattes e organiza automaticamente o barema para apoiar a avaliacao de candidatos a bolsas de Iniciacao Cientifica da UEFS.
      </p>
      <div className="hero-meta">
        <a
          className="hero-link"
          href={`http://www.pppg.uefs.br/arquivos/File/editais/IC/${currentYear}/Edital_IC_UEFS_${currentYear}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver edital IC UEFS {currentYear}
        </a>
      </div>
    </section>
  );
}
