import { Navigate, Route, Routes } from 'react-router-dom';
import IndexPage from './pages/index/IndexPage';
import LoginPage from './pages/login/LoginPage';
import CadastroPage from './pages/cadastro/CadastroPage';
import DashboardPage from './pages/dashboard/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/index" element={<Navigate to="/" replace />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />

      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/cadastro.html" element={<Navigate to="/cadastro" replace />} />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;