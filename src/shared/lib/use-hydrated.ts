"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false en el render del servidor y en la hidratación; true después.
 * Úsalo para lo que solo existe en el navegador (localStorage, portales de modales abiertos)
 * y así evitar errores de hidratación.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
