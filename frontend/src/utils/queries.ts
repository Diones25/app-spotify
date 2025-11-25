import { useQuery } from "@tanstack/react-query"
import {
  requester
} from "./api";
import type { UserProfile } from "@/types/UserProfile";
import type { UserPlaylistsResponse } from "@/types/UserPlaylistsResponse";

export const useMe = (token: string) => {
  const query = useQuery({
    queryKey: ['userMe'],
    queryFn: (): Promise<UserProfile> => requester({ Authorization: `Bearer ${token}` }).getMe(),
    enabled: !!token,
  });

  return query;
}

export const useUserPlaylists = (token: string, user_id: string) => {
  const query = useQuery({
    queryKey: ['userPlaylists', user_id],
    queryFn: (): Promise<UserPlaylistsResponse> => requester({ Authorization: `Bearer ${token}` }).getUserPlaylists(user_id)
  });

  return query;
}