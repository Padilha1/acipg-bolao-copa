import type { PrismaClient } from "../generated/prisma/index.js";

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  createAuthCode(input: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    return this.db.authCode.create({
      data: input,
    });
  }

  findLatestActiveCode(email: string) {
    return this.db.authCode.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  markCodeUsed(id: bigint) {
    return this.db.authCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  createSession(input: { userId: bigint; tokenHash: string; expiresAt: Date }) {
    return this.db.session.create({
      data: input,
    });
  }

  findSessionByHash(tokenHash: string) {
    return this.db.session.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }
}
