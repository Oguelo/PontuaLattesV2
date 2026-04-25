import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoginForm from './components/LoginForm';
import { normalizeRedirectPath } from '../../utils/legacyRoutes';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [values, setValues] = useState({ username: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  function onChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: 'info', message: 'Processando...' });

    try {
      const response = await api.post('/login', {
        username: values.username.trim(),
        password: values.password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Erro na autenticacao.');
      }

      localStorage.setItem('auth_token', response.data.token);
      setStatus({ type: 'success', message: response.data.message || 'Sucesso!' });

      const redirectRaw = params.get('redirect');
      navigate(normalizeRedirectPath(redirectRaw), { replace: true });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Erro na autenticacao.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 500 }}>
      <section className="hero" style={{ textAlign: 'center' }}>
        <h1>PontuaLattes</h1>
        <p>Entre para acessar o historico de consultas.</p>
      </section>

      <LoginForm values={values} onChange={onChange} onSubmit={onSubmit} status={status} loading={loading} />

      <section className="panel form-panel" style={{ textAlign: 'center' }}>
        <p>
          Nao tem conta? <Link className="hero-link" to="/cadastro">Criar cadastro</Link>
        </p>
      </section>
    </main>
  );
}
