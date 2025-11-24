import { RouterProvider } from "react-router-dom";
import Router from "./router/router";
import { TokenProvider } from "./contexts/TokenContext";
import { Providers } from "./utils/providers";

function App() {

  return (
    <>
      <Providers>
        <TokenProvider>
          <RouterProvider router={Router} />
        </TokenProvider>
      </Providers>
    </>
  )
}

export default App
