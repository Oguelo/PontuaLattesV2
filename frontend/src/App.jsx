import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import Login from "./pages/login";
import Private from "./routes/Private";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Private>
        <Home />
      </Private>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export { router };
