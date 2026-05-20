import { useState, useEffect } from 'react';
import axios from 'axios';
import BaremaCard from './components/BaremaCard';
import logoUefs from './assets/logoUefs.png'; 
import aeriLogo from './assets/aeriLogo.png';
import pppgLogo from './assets/pppgLogo.png';

const getCurrentBaremaYear = () => new Date().getFullYear();
const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Home() {
  const currentYear = getCurrentBaremaYear();
  const [url, setUrl] = useState('');
  

  const [tipoBarema, setTipoBarema] = useState('pppg'); 
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [topPesquisas, setTopPesquisas] = useState([]);

  useEffect(() => {
    const historicoSalvo = localStorage.getItem('rankingLattes');
    if (historicoSalvo) {
      setTopPesquisas(JSON.parse(historicoSalvo));
    }
  }, []);

 
  useEffect(() => {
    setResultado(null);
    setStatus({ type: '', message: '' });
  }, [tipoBarema]);

  const realizarConsulta = async (termoDeBusca) => {
    if (!termoDeBusca) return;

    setLoading(true);
    setStatus({ type: 'info', message: `Consultando a API para o barema ${tipoBarema.toUpperCase()}...` });
    setResultado(null);
  
    setUrl(termoDeBusca); 
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await axios.post('/api/lattes', { 
        url: termoDeBusca,
        tipo: tipoBarema 
      });
      
      if (response.data && response.data.success) {
        setResultado(response.data);
        setStatus({ type: 'success', message: 'Coleta realizada com sucesso.' });
        atualizarRanking(response.data, termoDeBusca); 
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

  const atualizarRanking = (novoDado, termoPesquisado) => {
    const pedacosUrl = termoPesquisado.split('/');
    const idLimpo = pedacosUrl[pedacosUrl.length - 1].trim();

    setTopPesquisas((rankingAntigo) => {
      const novaPesquisa = {
        nome: novoDado.nome || 'Não identificado',
        pontuacao: novoDado.barema.total_limitado,
        id: idLimpo 
      };

      const listaSemDuplicata = rankingAntigo.filter(item => item.id !== novaPesquisa.id);

      const novaLista = [...listaSemDuplicata, novaPesquisa]
        .sort((a, b) => b.pontuacao - a.pontuacao)
        .slice(0, 5);

      localStorage.setItem('rankingLattes', JSON.stringify(novaLista));

      return novaLista;
    });
  };
 
  const buscarLattes = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Informe a URL completa ou o código do currículo Lattes.' });
      return;
    }
    realizarConsulta(url); 
  };

  const limparHistorico = () => {
    localStorage.removeItem('rankingLattes');
    setTopPesquisas([]);
  };

  return (
    <main className="page">
      <section className="hero hero-responsive">
        <div className="hero-text-container"> 
          <span className="hero-badge">
            Projeto de extensão • UEFS
          </span>
          <h1>PontuaLattes</h1>
          <p className="hero-lead">
            Sistema que analisa o currículo Lattes e organiza automaticamente o barema para apoiar a avaliação de candidatos a bolsas da UEFS.
          </p>
          <div className="hero-meta" div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',marginTop:'50px', marginRight:'100px'}}>
            <a 
              className="hero-link" 
              href={`http://www.pppg.uefs.br/arquivos/File/editais/IC/${currentYear}/Edital_IC_UEFS_${currentYear}.pdf`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Ver edital IC UEFS {currentYear}
            </a>
            <a //trocar o link para a aeri se tiver
              className="hero-link" 
              href={`https://aeri.uefs.br/tag/editais-abertos/`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Ver editais AERI UEFS
            </a>

          </div>
        </div>

        {/* Container vertical para alinhar a logo principal em cima e as outras embaixo */}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
  
  
  <img 
    src={logoUefs} 
    alt="logoUefs" 
    style={{ 
      maxWidth: '200px',
      width: '100%',
      height: 'auto',         
      borderRadius: '12px',   
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }} 
  />

  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
    
   
    <img 
      src={pppgLogo} 
      alt="Logo PPPG" 
      style={{ 
        maxWidth: '94px',
        width: '100%',
        height: 'auto',         
        borderRadius: '8px',   
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }} 
    />

   
    <img 
      src={aeriLogo} 
      alt="Logo AERI" 
      style={{ 
        maxWidth: '94px', 
        width: '100%',
        height: '50px ',         
        borderRadius: '8px',   
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '24px',
      }} 
    />

  </div>
</div>
      </section>

      <section className="panel form-panel">
        <form onSubmit={buscarLattes}>

          <div style={{ marginBottom: '16px' }}>
            <label className="hero-text-container"   htmlFor="tipo-barema">Selecione o edital / tipo de Barema </label>
            <select
              className="hero-type-list"
              id="tipo-barema"
              value={tipoBarema}
              onChange={(e) => setTipoBarema(e.target.value)}
              
            >
              <option value="pppg">PPPG (Pesquisa / Iniciação Científica)</option>
              <option value="aeri">AERI (Relações Internacionais / Intercâmbio)</option>
            </select>
          </div>

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
          
          {status.message && (
            <div className={`status visible ${status.type}`} aria-live="polite">
              {status.message}
            </div>
          )}
        </form>
      </section>

      {resultado && resultado.barema && (
        <section id="results" className="results visible">
          <div className="summary">
            <article className="panel stat-card">
              <h2>Total do barema ({tipoBarema.toUpperCase()})</h2>
              <div className="stat-value">{formatNumber(resultado.barema.total_limitado)}</div>
              <div className="stat-label">Pontuação máxima: {tipoBarema === 'pppg' ? '60' : '100'} pontos</div>
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
          <BaremaCard barema={resultado.barema} />
        </section>
      )}

      {topPesquisas.length > 0 && (
        <section className="panel ranking-panel">
          <div className="ranking-header">
            <h2 style={{ margin: 0 }}>Top 5 Pontuações Pesquisadas</h2>
            <button 
              onClick={limparHistorico}
              className="btn-clear-ranking"
            >
              Limpar Ranking
            </button>
          </div>
          
          <ul className="ranking-list">
            {topPesquisas.map((item, index) => (
              <li 
                key={item.id} 
                className={`ranking-item ${index === 0 ? 'first-place' : ''}`}
              >
                <div className="ranking-info">
                  <span className="ranking-position">
                    {index + 1}º
                  </span>
                  <span 
                    className="ranking-name ranking-link" 
                    onClick={() => realizarConsulta(item.id)}
                    title={`Recalcular barema de ${item.nome}`}
                  >
                    {item.nome}
                  </span>
                </div>
                
                <div className="ranking-score">
                  {formatNumber(item.pontuacao)} <span className="ranking-score-label">pts</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
    </main>
  );
}