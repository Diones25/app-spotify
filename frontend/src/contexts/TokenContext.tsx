import { createContext, useState, type ReactNode } from "react";

type TokenContextType = {
  token: string | null;
  setToken: (token: string) => void;
};

export const TokenContext = createContext<TokenContextType | null>(null);

type TokenProviderProps = {
  children: ReactNode;
};

export const TokenProvider = ({ children }: TokenProviderProps) => {
  const [token, setTokenState] = useState<string | null>(() => {
    // Pega o token do localStorage na inicialização
    return localStorage.getItem('spotify-token');
  });

  const setToken = (newToken: string) => {
    // Salva o token no localStorage e no estado
    localStorage.setItem('spotify-token', newToken);
    setTokenState(newToken);
  };

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};