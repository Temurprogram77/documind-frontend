/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_API_KEY ||
      (process.env.NODE_ENV === "production"
        ? "https://documind-ai-gqxr.onrender.com"
        : "http://localhost:8000"),
    NEXT_API_KEY:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_API_KEY ||
      (process.env.NODE_ENV === "production"
        ? "https://documind-ai-gqxr.onrender.com"
        : "http://localhost:8000"),
  },
};

export default nextConfig;
