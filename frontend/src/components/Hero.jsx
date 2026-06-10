import logoUefs from '../assets/logoUefs.png';

export default function Hero({ currentYear }) {
  return (
    <section className="hero hero-responsive">
      <div className="hero-text-container"> 
        <span className="hero-badge">Projeto de extensão • UEFS</span>
        <h1>PontuaLattes</h1>
        <p className="hero-lead">
          Sistema que analisa o currículo Lattes e organiza automaticamente o barema para apoiar a avaliação de candidatos a bolsas de Iniciação Científica da UEFS.
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
      </div>

      <img 
        src={logoUefs} 
        alt="logoUefs" 
        style={{ 
          maxWidth: '200px', width: '100%', height: 'auto',         
          borderRadius: '12px', flexShrink: 0,          
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }} 
      />
    </section>
  );
}