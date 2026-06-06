import { emailSchema } from "@bolao-acipg/shared";
import type { FastifyReply } from "fastify";
import {
  generateCode,
  generateToken,
  hashSecret,
  safeCompare,
} from "../lib/crypto.js";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/http-error.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import type { PoolRepository } from "../repositories/pool.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";

const AUTH_CODE_TTL_MINUTES = 10;
const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE_NAME = "bolao_session";
const USE_SECURE_COOKIE =
  env.NODE_ENV === "production" || env.WEB_ORIGIN.startsWith("https://");

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly poolRepository: PoolRepository,
  ) {}

  async start(emailInput: string, name: string, reply: FastifyReply) {
    const email = emailSchema.parse(emailInput);
    const code = generateCode();

    await this.authRepository.createAuthCode({
      email,
      code,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MINUTES * 60 * 1000),
    });

    if (env.NODE_ENV !== "production") {
      console.info(`[auth] activation code for ${email}: ${code}`);
    }

    return this.createSessionForEmail(email, reply, name);
  }

  async verify(emailInput: string, code: string, reply: FastifyReply) {
    const email = emailSchema.parse(emailInput);
    const authCode = await this.authRepository.findLatestActiveCode(email);

    if (!authCode || !safeCompare(authCode.code, code)) {
      throw new HttpError(401, "Codigo invalido ou expirado.");
    }

    await this.authRepository.markCodeUsed(authCode.id);

    return this.createSessionForEmail(email, reply);
  }

  private async createSessionForEmail(
    email: string,
    reply?: FastifyReply,
    name?: string,
  ) {
    const user = await this.userRepository.upsertByEmail(email, name);
    const pool = await this.poolRepository.upsertDefaultPool();
    const entry = await this.poolRepository.upsertEntry(user.id, pool.id);
    const token = generateToken();

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash: hashSecret(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    reply?.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: USE_SECURE_COOKIE ? "none" : "lax",
      secure: USE_SECURE_COOKIE,
      path: "/",
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return { user, entry };
  }

  async authenticate(token?: string) {
    if (!token) {
      throw new HttpError(401, "Sessao ausente.");
    }

    const session = await this.authRepository.findSessionByHash(
      hashSecret(token),
    );
    if (!session) {
      throw new HttpError(401, "Sessao invalida.");
    }

    const pool = await this.poolRepository.upsertDefaultPool();
    const entry = await this.poolRepository.findEntry(session.userId, pool.id);

    return {
      user: session.user,
      entry,
    };
  }
}
