import type { UserProfile } from '@/types/UserProfile';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

export const requester = (config: any, contentType?: string): any => {
  const service = axios.create({
    baseURL: config.baseURL || "https://api.spotify.com/v1",
    ...config.options,
  });

  service.interceptors.request.use(
    (req) => {
      req.headers = {
        "Content-Type": contentType || "application/json",
        Authorization: config.Authorization,
        ...config.headers
      };
      return req;
    },
    (error) => Promise.reject(error)
  );

  service.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Se o erro for 401 e ainda não tentamos renovar o token
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Marca a requisição para evitar loops infinitos

        const refreshToken = localStorage.getItem('spotify-refresh-token');
        if (!refreshToken) {
          // Se não há refresh token, a sessão é inválida. Redireciona para o login.
          window.location.href = 'http://localhost:8888/login';
          return Promise.reject(error);
        }

        try {
          // Chama o backend para obter um novo access token
          const { data } = await axios.get(`http://localhost:8888/api/refresh_token?refresh_token=${refreshToken}`);
          const newAccessToken = data.access_token;

          // Atualiza o token no localStorage e no cabeçalho da requisição original
          localStorage.setItem('spotify-access-token', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          // Tenta novamente a requisição original com o novo token
          return service(originalRequest);
        } catch (refreshError) {
          // Se a renovação falhar, o refresh_token é inválido. Limpa tudo e redireciona para o login.
          localStorage.removeItem('spotify-access-token');
          localStorage.removeItem('spotify-refresh-token');
          window.location.href = 'http://localhost:8888/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return {
    async getMe(): Promise<UserProfile> {
      const response = await service.get(`/me`);
      return response.data;
    },

    async getUserPlaylists(user_id: string) {
      const response = await service.get(`/users/${user_id}/playlists`);
      return response.data;
    },

    async getUserArtists() {
      const response = await service.get(`/me/following?type=artist`);
      return response.data;
    },

    async getUserAlbums() {
      const response = await service.get(`/me/albums`);
      return response.data;
    },

    async get<T = any>(uri: string): Promise<AxiosResponse<T>> {
      const response = await service.get<T>(uri);
      return response;
    },
    async post<T = any>(uri: string, data: any): Promise<AxiosResponse<T>> {
      const response = await service.post<T>(uri, data);
      return response;
    },
    async put<T = any>(uri: string, data: any): Promise<AxiosResponse<T>> {
      const response = await service.put<T>(uri, data);
      return response;
    },
    async patch<T = any>(uri: string, data: any): Promise<AxiosResponse<T>> {
      const response = await service.patch<T>(uri, data);
      return response;
    }
    ,
    async delete<T = any>(uri: string, data: any): Promise<AxiosResponse<T>> {
      const response = await service.delete<T>(uri, data);
      return response;
    }
  }
}
