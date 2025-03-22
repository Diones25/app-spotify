import { createContext, useState } from "react";
import { Token } from "../types/Token";
import { Children } from "../types/Children";

export const TokenContext = createContext<Token | null>(null);

export const TokenProvider = ({ children }: Children) => {
  const [token, setToken] = useState("");
  return (
    <TokenContext.Provider value={{ token, setToken }}>
      { children }
    </TokenContext.Provider>
  );
}