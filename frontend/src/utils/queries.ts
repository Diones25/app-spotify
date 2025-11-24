import { useQuery } from "@tanstack/react-query"
import {
  requester
} from "./api";
import type { UserProfile } from "@/types/UserProfile";

export const useMe = (token: string) => {
  const query = useQuery({
    queryKey: ['userMe'],
    queryFn: (): Promise<UserProfile> => requester({ Authorization: `Bearer ${token}` }).getMe(),
    enabled: !!token,
  });

  return query;
}
