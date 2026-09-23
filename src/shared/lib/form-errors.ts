import type { FormInstance } from "antd";

import { ApiError } from "@/core/http/api-error";

/**
 * Pinta en el formulario los errores de validación de Laravel (422).
 * `fieldMap` traduce los nombres snake_case del backend a los campos del formulario.
 * Devuelve true si algún error se asignó a un campo.
 */
export function applyApiFieldErrors(
  form: FormInstance,
  error: unknown,
  fieldMap: Record<string, string> = {},
): boolean {
  if (!(error instanceof ApiError)) return false;

  const fields = Object.entries(error.fieldErrors).map(([name, errors]) => ({
    name: fieldMap[name] ?? name,
    errors,
  }));

  form.setFields(fields);
  return fields.length > 0;
}
