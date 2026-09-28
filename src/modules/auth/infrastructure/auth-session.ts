import type { AuthSession, User } from "../domain/auth.types";

function unwrapUser(payload: unknown): User {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta de usuario inválida.");
  }

  const record = payload as Record<string, unknown>;

  if ("data" in record && record.data && typeof record.data === "object" && !("email" in record)) {
    return unwrapUser(record.data);
  }

  if (typeof record.email !== "string" && typeof record.name !== "string") {
    throw new Error("Respuesta de usuario sin nombre ni email.");
  }

  return payload as User;
}

export function unwrapSession(payload: unknown): AuthSession {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta de sesión inválida.");
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.token !== "string") {
    throw new Error("Respuesta de sesión sin token.");
  }

  return {
    token: record.token,
    refresh_token: typeof record.refresh_token === "string" ? record.refresh_token : undefined,
    expires_in: typeof record.expires_in === "number" ? record.expires_in : undefined,
    token_type: typeof record.token_type === "string" ? record.token_type : undefined,
    user: unwrapUser(record.user),
  };
}

export function unwrapUserPayload(payload: unknown): User {
  return unwrapUser(payload);
}
