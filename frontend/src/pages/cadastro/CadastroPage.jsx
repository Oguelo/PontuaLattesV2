import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RegisterForm from './components/RegisterForm';

export default function CadastroPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  function onChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas nao coincidem.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Processando...' });

    try {
      const response = await api.post('/register', {
        username: values.username.trim(),
        password: values.password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Erro no cadastro.');
      }

      setStatus({ type: 'success', message: response.data.message || 'Cadastro realizado com sucesso!' });
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Erro no cadastro.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 500 }}>
      <section className="hero" style={{ textAlign: 'center' }}>
        <h1>Cadastro</h1>
        <p>Crie sua conta para calcular os baremas do Lattes.</p>
      </section>

      <RegisterForm values={values} onChange={onChange} onSubmit={onSubmit} status={status} loading={loading} />

      <section className="panel form-panel" style={{ textAlign: 'center', marginTop: 20 }}>
        <p>
          Ja tem uma conta? <Link className="hero-link" to="/login">Fazer Login</Link>
        </p>
      </section>
    </main>
  );
}
