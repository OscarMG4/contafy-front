export const env = {
  appName: "Contafy",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://api.contafy.test/api/v1",
} as const;
