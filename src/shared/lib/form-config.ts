import type { ConfigProviderProps, FormProps } from "antd";

/** Mensajes de validación: el borde rojo lo aplica Ant Design al Form.Item en error. */
export const formValidateMessages: NonNullable<FormProps["validateMessages"]> = {
  required: "Completar campo ${label}",
  whitespace: "Completar campo ${label}",
  types: {
    email: "Completar campo ${label} con un correo válido",
    number: "Completar campo ${label} con un número válido",
  },
  string: {
    min: "${label} debe tener al menos ${min} caracteres",
    max: "${label} no puede superar ${max} caracteres",
  },
  number: {
    min: "${label} debe ser al menos ${min}",
    max: "${label} no puede ser mayor a ${max}",
  },
  pattern: {
    mismatch: "Completar campo ${label} con un formato válido",
  },
};

export const appFormConfig: NonNullable<ConfigProviderProps["form"]> = {
  validateMessages: formValidateMessages,
  requiredMark: true,
  scrollToFirstError: { behavior: "smooth", block: "center" },
};

/** Regla requerida explícita (Form.List o campos sin label). */
export function requiredField(fieldName: string) {
  return { required: true as const, message: `Completar campo ${fieldName}` };
}
