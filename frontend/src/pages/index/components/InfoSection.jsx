export default function InfoSection() {
  return (
    <section className="panel info-panel">
      <div className="info-grid">
        <article className="info-card">
          <h2>Objetivo</h2>
          <p>Facilitar a analise da producao academica e a estimativa da pontuacao no processo seletivo de IC.</p>
        </article>
        <article className="info-card">
          <h2>Contexto</h2>
          <p>A aplicacao consulta dados publicos do Lattes e apresenta os principais indicadores e o barema de forma clara.</p>
        </article>
        <article className="info-card">
          <h2>Edital</h2>
          <p>O resultado deve ser conferido com as regras do edital vigente da UEFS para bolsas de IC.</p>
        </article>
      </div>
    </section>
  );
}
