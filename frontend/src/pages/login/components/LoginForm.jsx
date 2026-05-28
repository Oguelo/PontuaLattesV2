export default function LoginForm({ values, onChange, onSubmit, status, loading }) {
  return (
    <section className="panel form-panel">
      <form id="auth-form" onSubmit={onSubmit}>
        <div>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            value={values.username}
            onChange={(event) => onChange('username', event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) => onChange('password', event.target.value)}
            required
          />
        </div>
        <button id="submit-button" type="submit" style={{ marginTop: 10 }} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <div id="status" className={`status ${status.message ? 'visible' : ''} ${status.type}`} aria-live="polite">
          {status.message}
        </div>
      </form>
    </section>
  );
}
