import { createBrowserRouter } from "react-router-dom";
import Login from "../components/Login";
import Auth from "../components/Auth";

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
  }
]);

export default Router;