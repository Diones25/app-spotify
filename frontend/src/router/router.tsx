import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../components/Login";
import Auth from "../components/Auth";
import Home from "../components/Home";
import { useContext } from "react";
import { TokenContext } from "../contexts/TokenContext";

const Router = createBrowserRouter([
  {
    path: '/',
    Component() {
      return (
        <Login />
      )
    }
  },
  {
    path: '/auth/:token',
    Component() {
      return (
        <Auth />
      )
    }
  },
  {
    path: '/home',
    element: <PrivateRoute><Home /></PrivateRoute>
  }
]);

function PrivateRoute({ children }: { children: JSX.Element }) {
  const tokenCtx = useContext(TokenContext);
  return tokenCtx?.token ? children : <Navigate to="/" />;
}

export default Router;