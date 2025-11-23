import { createContext, useState, type ReactNode } from "react";

type TokenContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (access: string) => void;
};

export const TokenContext = createContext<TokenContextType | null>(null);

type TokenProviderProps = {
  children: ReactNode;
};

export const TokenProvider = ({ children }: TokenProviderProps) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    return localStorage.getItem('spotify-access-token');
  });

  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => {
    return localStorage.getItem('spotify-refresh-token');
  });

  const setTokens = (newAccessToken: string, newRefreshToken: string) => {
    localStorage.setItem('spotify-access-token', newAccessToken);
    localStorage.setItem('spotify-refresh-token', newRefreshToken);
    setAccessTokenState(newAccessToken);
    setRefreshTokenState(newRefreshToken);
  };

  const setAccessToken = (newAccessToken: string) => {
    localStorage.setItem('spotify-access-token', newAccessToken);
    setAccessTokenState(newAccessToken);
  };

  return (
    <TokenContext.Provider value={{ accessToken, refreshToken, setTokens, setAccessToken }}>
      {children}
    </TokenContext.Provider>
  );
};