import { isAxiosError } from "axios";

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (isAxiosError(error)) {
      if (!error.response) {
        return new ApiError("No se pudo conectar con el servidor.", 0, "network_error");
      }

      const { status, data } = error.response;
      return new ApiError(
        data?.message ?? "Ocurrió un error inesperado.",
        status,
        data?.code,
        data?.errors ?? {},
      );
    }

    return new ApiError("Ocurrió un error inesperado.", 500);
  }
}
