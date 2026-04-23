import styles from "./login.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useContext } from "react";
import { UserContext } from "../../context/user";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { currentUser, signIn, getUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    getUser();
    if (currentUser) {
      navigate("/", { replace: true });
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (email === "" || password === "") {
      alert("Preencha todos os campos!");
      return;
    }
    errorMessage === "" ? errorMessage : setErrorMessage("");
    signIn(email, password)
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch((error) => {
        setErrorMessage("Erro ao fazer login, tente novamente");
        console.log(error);
      });
  }

  return (
    <main className={styles.container}>
      <section className={`${styles.hero} ${styles.heroResponsive}`}>
        <div>
          <h1 className={styles.title}>PontuaLattes</h1>
          <p className={styles.subtitle}>
            Realize o seu login para ter acesso a plataforma!
          </p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            className={styles.input}
          />

          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <span
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {" "}
              {showPassword ? <FiEyeOff /> : <FiEye />}{" "}
            </span>
          </div>

          <button type="submit" className={styles.button}>
            {" "}
            Entrar{" "}
          </button>
        </form>
      </section>
    </main>
  );
}
