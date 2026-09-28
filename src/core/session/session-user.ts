import type { User } from "@/modules/auth/domain/auth.types";

const USER_KEY = "contafy_user";

/** Perfil en localStorage para mostrar nombre aunque /auth/me falle o tarde. */
export const sessionUser = {
  get(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.name && !parsed.email) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  save(user: User) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(USER_KEY);
  },
};
