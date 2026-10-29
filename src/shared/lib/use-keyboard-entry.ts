"use client";

import { useEffect, type RefObject } from "react";

/**
 * Captura con teclado al estilo de los sistemas de escritorio (SiempreSoft):
 * Enter pasa al siguiente campo en lugar de enviar el formulario.
 * No actúa en textareas, botones, ni mientras un desplegable de antd está abierto
 * (en ese caso Enter elige la opción).
 */
export function useEnterToNextField(containerRef: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
      if (target.getAttribute("aria-expanded") === "true") return;
      if (!container.contains(target)) return;

      const fields = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
        ),
      ).filter((el) => el.offsetParent !== null && el.tabIndex !== -1);

      const index = fields.indexOf(target);
      if (index === -1) return;

      event.preventDefault();
      const next = fields[index + 1];
      if (next) {
        next.focus();
        if (next instanceof HTMLInputElement) next.select();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [containerRef, enabled]);
}

export type HotkeyMap = Partial<Record<"F2" | "F3" | "F4" | "F8" | "F9" | "F10" | "Escape" | "CtrlEnter", () => void>>;

/**
 * Atajos de teclado globales mientras la pantalla está activa:
 * F2 buscar artículos, F9 calcular, F10 / Ctrl+Enter aceptar, Esc cancelar.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key === "Enter" && (event.ctrlKey || event.metaKey) ? "CtrlEnter" : event.key;
      const handler = map[key as keyof HotkeyMap];
      if (!handler) return;
      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [map, enabled]);
}
