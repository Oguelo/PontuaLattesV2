import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserContext } from "../context/user";
import { useContext } from "react";

export default function Private({ children }) {
  const [loading, setLoading] = useState(true);

  const { signed } = useContext(UserContext);

  useEffect(() => {
    async function checkAuth() {
      if (!signed) {
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  return children;
}
