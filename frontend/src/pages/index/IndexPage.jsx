import { useState } from 'react';
import HeroSection from './components/HeroSection';
import LattesForm from './components/LattesForm';
import InfoSection from './components/InfoSection';
import ResultsSection from './components/ResultsSection';
import FooterSection from './components/FooterSection';
import api from '../../services/api';

export default function IndexPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [resultado, setResultado] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();

    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Informe a URL completa ou o codigo do curriculo Lattes.' });
      return;
    }

    setLoading(true);
    setResultado(null);
    setStatus({ type: 'info', message: 'Consultando a API e coletando os dados do curriculo...' });

    try {
      const response = await api.post('/lattes', { url: url.trim() });
      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || 'Nao foi possivel concluir a coleta.');
      }

      setResultado(data);
      setStatus({ type: 'success', message: 'Coleta realizada com sucesso.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Erro inesperado ao chamar a API.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <HeroSection />
      <LattesForm
        url={url}
        onUrlChange={setUrl}
        onSubmit={onSubmit}
        loading={loading}
        status={status}
      />
      <InfoSection />
      <ResultsSection resultado={resultado} />
      <FooterSection />
    </main>
  );
}
