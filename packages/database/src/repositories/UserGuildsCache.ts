import { UserGuildsData } from "@shaw/types";
import { CacheRepository } from "./CacheRepository";
import { REDIS_CACHE_TTL } from "../config";

export class UserGuildsCache extends CacheRepository<UserGuildsData> {
  constructor() {
    super("userGuilds:", REDIS_CACHE_TTL.UserGuilds);
  }

  protected getEntityKey(entity: Partial<UserGuildsData>): string | null {
    if (entity.userId) return entity.userId;
    return null;
  }
}
