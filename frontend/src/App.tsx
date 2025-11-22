import { RouterProvider } from "react-router-dom";
import Router from "./router/router";
import { TokenProvider } from "./contexts/TokenContext";

function App() {

  return (
    <>
      <TokenProvider>
        <RouterProvider router={Router} />
      </TokenProvider>
    </>
  )
}

export default App
