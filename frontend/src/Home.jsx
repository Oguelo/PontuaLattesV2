import { useState } from 'react';
import axios from 'axios';
import BaremaCard from './components/BaremaCard';


const getMinimumBaremaYear = () => new Date().getFullYear() - 5;
const getCurrentBaremaYear = () => new Date().getFullYear();
const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Home() {
  
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  
  const buscarLattes = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Informe a URL completa ou o código do currículo Lattes.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Consultando a API e coletando os dados do currículo...' });
    setResultado(null);
    try {
     
      const response = await axios.post('/api/lattes', { url });
      
      if (response.data && response.data.success) {
        setResultado(response.data);
        setStatus({ type: 'success', message: 'Coleta realizada com sucesso.' });
      } else {
        throw new Error(response.data.message || 'Erro na resposta da API.');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || error.message || 'Erro inesperado ao chamar a API.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      {/* Seção Hero */}
      <section className="hero">
        <span className="hero-badge">Projeto de extensão • UEFS</span>
        <h1>PontuaLattes</h1>
        <p className="hero-lead" style={{ textAlign: 'justify' }}>
          Sistema que analisa o currículo Lattes e organiza automaticamente o barema para apoiar a avaliação de candidatos a bolsas de Iniciação Científica da UEFS.
        </p>
        <div className="hero-meta">
          <a className="hero-link" href="http://www.pppg.uefs.br/arquivos/File/editais/IC/2026/Edital_IC_UEFS_2026.pdf" target="_blank" rel="noopener noreferrer">
            Ver edital IC UEFS 2026
          </a>
        </div>
      </section>

      {/* Seção do Formulário */}
      <section className="panel form-panel">
        <form onSubmit={buscarLattes}>
          <div>
            <label htmlFor="lattes-url">URL completa ou código do currículo Lattes</label>
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
          
          {/* Caixa de Status Condicional */}
          {status.message && (
            <div className={`status visible ${status.type}`} aria-live="polite">
              {status.message}
            </div>
          )}
        </form>
      </section>

      {/* Renderização Condicional dos Resultados: Só aparece se 'resultado' não for nulo */}
      {resultado && resultado.barema && (
        <section id="results" className="results visible">
          <div className="summary">
            <article className="panel stat-card">
              <h2>Total do barema</h2>
              <div className="stat-value">{formatNumber(resultado.barema.total_limitado)}</div>
              <div className="stat-label">Pontuação máxima: 60 pontos</div>
            </article>
            <article className="panel stat-card">
              <h2>Total de publicações</h2>
              <div className="stat-value">{resultado.publicacoes?.total_geral || 0}</div>
              <div className="stat-label">Soma das séries bibliográficas extraídas</div>
            </article>
          </div>
          
          <article className="panel details-card">
            <h2>Resumo da coleta</h2>
            <ul className="details-list">
              <li><strong>Nome:</strong> {resultado.nome || 'Não identificado'}</li>
              <li><strong>Indicadores:</strong> <a className="soft-link" href={`http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript=${resultado.code}`} target="_blank" rel="noopener noreferrer">Link</a></li>
            </ul>
          </article>
          {/* Chamando o nosso novo componente React aqui! */}
          <BaremaCard barema={resultado.barema} />
        </section>
      )}

      {/* Rodapé */}
      <footer className="footer panel">
        <div className="footer-grid">
          <div>
            <h2>Desenvolvedores:</h2>
            <p>Abel Galvão, Alex Júnior e Bruno Campos</p>
            <h2 style={{ marginTop: '24px' }}>Agradecimentos:</h2>
            <p>Ao professor Mirco Ragni por fornecer a ideia por trás para a coleta de dados do Lattes.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}