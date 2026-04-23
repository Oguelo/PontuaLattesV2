import { useState } from "react";
import api from "../shared/config/api";
import { UserContext } from "./user.js";

function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const urlLogin = api.auth.login;

  function getUser() {
    const storagedUser = localStorage.getItem("@user");

    if (storagedUser) {
      setCurrentUser(JSON.parse(storagedUser));
    }
  }

  function signIn(email, password) {
    return fetch(urlLogin, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data.user);
        localStorage.setItem("@user", JSON.stringify(data.user));
      });
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("@user");
  }

  return (
    <UserContext.Provider
      value={{ currentUser, signed: !!currentUser, signIn, logout, getUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
export default UserProvider;
