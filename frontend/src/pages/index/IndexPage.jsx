import { useState } from 'react';
import HeroSection from './components/HeroSection';
import LattesForm from './components/LattesForm';
import InfoSection from './components/InfoSection';
import ResultsSection from './components/ResultsSection';
import FooterSection from './components/FooterSection';
import api from '../../services/api';

export default function IndexPage() {
  const [url, setUrl] = useState('');
  const [tipo, setTipo] = useState('professor');
  const [dataIngresso, setDataIngresso] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [resultado, setResultado] = useState(null);

  function handleTipoChange(novoTipo) {
    setTipo(novoTipo);
    if (novoTipo !== 'aeri') {
      setDataIngresso('');
    }
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Informe o codigo alfanumerico do curriculo Lattes.' });
      return;
    }

    setLoading(true);
    setResultado(null);
    setStatus({ type: 'info', message: 'Consultando a API e coletando os dados do curriculo...' });

    try {
      const payload = {
        code: url.trim(),
        tipo,
      };

      if (tipo === 'aeri' && dataIngresso.trim()) {
        payload.data_ingresso = dataIngresso.trim();
      }

      const response = await api.post('/lattes', payload);
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
        tipo={tipo}
        onTipoChange={handleTipoChange}
        dataIngresso={dataIngresso}
        onDataIngressoChange={setDataIngresso}
      />
      <InfoSection />
      <ResultsSection resultado={resultado} />
      <FooterSection />
    </main>
  );
}
