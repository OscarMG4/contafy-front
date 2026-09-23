export const env = {
  appName: "Contafy",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
} as const;
