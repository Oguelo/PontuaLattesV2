import styles from "./login.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  //   const navigate = useNavigate();

  //   function handleSubmit(event) {
  //     event.preventDefault();

  //     if (email === "" || password === "") alert("Preencha todos os campos!");

  //     signInWithEmailAndPassword(auth, email, password)
  //       .then(() => {
  //         navigate("/", { replace: true });
  //         console.log("Logado com sucesso");
  //       })
  //       .catch((error) => {
  //         console.log("Erro ao fazer login");
  //         console.log(error);
  //       });
  //   }

  return (
    <main className={styles.container}>
      <h1>PontuaLattes</h1>
      <form className={styles.form}>
        <input
          type="email"
          placeholder="Insira seu endereço de e-mail:"
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
    </main>
  );
}
