import { useQuery } from "@tanstack/react-query"
import {
  requester
} from "./api";
import type { UserProfile } from "@/types/UserProfile";
import type { UserPlaylistsResponse } from "@/types/UserPlaylistsResponse";
import type { FollowedArtistsResponse } from "@/types/FollowedArtistsResponse";

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

export const useUserArtists = (token: string) => {
  const query = useQuery({
    queryKey: ['userArtists'],
    queryFn: (): Promise<FollowedArtistsResponse> => requester({ Authorization: `Bearer ${token}` }).getUserArtists()
  });

  return query;
}