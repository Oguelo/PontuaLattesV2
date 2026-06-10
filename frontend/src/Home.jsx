import { useState } from 'react';
import { api } from './services/api';
import { useRanking } from './hooks/useRanking';

// Componentes Visuais
import Hero from './components/Hero';
import LattesForm from './components/LattesForm';
import Results from './components/Results';
import Ranking from './components/Ranking';
import Footer from './components/Footer';

const getCurrentBaremaYear = () => new Date().getFullYear();

export default function Home() {
  const currentYear = getCurrentBaremaYear();
  
  const { topPesquisas, atualizarRanking, limparHistorico } = useRanking();

  const [url, setUrl] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [searchType, setSearchType] = useState('aeri');
  const [aeriEntryYear, setAeriEntryYear] = useState('');

  const isAeriSelected = searchType === 'aeri';

  const buildPayload = (code) => {
    const payload = { code: code, tipo: searchType };
    if (searchType === 'aeri' && aeriEntryYear) {
      payload.data_ingresso = aeriEntryYear.toString();
    }
    return payload;
  };

  const realizarConsulta = async (termoDeBusca) => {
    if (!termoDeBusca) return;
    setLoading(true);
    setStatus({ type: 'info', message: 'Consultando a API e coletando os dados do currículo...' });
    setResultado(null);
    setUrl(termoDeBusca); 

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Usando a nossa api configurada (repare que o '/api' saiu da rota)
      const response = await api.post('/lattes', buildPayload(termoDeBusca));
      
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
        message: error.response?.data?.message || error.message || 'Erro inesperado.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarLattes = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Informe a URL ou o código do currículo.' });
      return;
    }
    realizarConsulta(url); 
  };

  return (
    <main className="page">
      <Hero currentYear={currentYear} />
      
      <LattesForm 
        buscarLattes={buscarLattes}
        searchType={searchType}
        setSearchType={setSearchType}
        isAeriSelected={isAeriSelected}
        aeriEntryYear={aeriEntryYear}
        setAeriEntryYear={setAeriEntryYear}
        currentYear={currentYear}
        url={url}
        setUrl={setUrl}
        loading={loading}
        status={status}
      />

      <Results resultado={resultado} />

      <Ranking 
        topPesquisas={topPesquisas} 
        limparHistorico={limparHistorico} 
        realizarConsulta={realizarConsulta} 
      />

      <Footer />
    </main>
  );
}