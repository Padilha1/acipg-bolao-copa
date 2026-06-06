import type { Entry, User } from "../generated/prisma/index.js";
import { env } from "../lib/env.js";
import { entryToDto, userToDto } from "../lib/serializers.js";
import type { UserRepository } from "../repositories/user.repository.js";

export class MeService {
  constructor(private readonly userRepository: UserRepository) {}

  toDto(user: User, entry: Entry | null) {
    return {
      user: userToDto(user, user.email.toLowerCase() === env.ADMIN_EMAIL),
      entry: entry ? entryToDto(entry) : null,
    };
  }

  async update(userId: bigint, data: { name?: string; displayName?: string }) {
    return this.userRepository.updateProfile(userId, {
      name: data.name ?? data.displayName,
    });
  }
}
