import path from "node:path";
import type {NextConfig} from "next";

const config:NextConfig={
 output:"standalone",
 // The web app imports workspace packages and the Prisma schema lives in apps/api.
 // Trace from the repository root so Vercel includes runtime dependencies outside apps/web.
 outputFileTracingRoot:path.join(__dirname,"../.."),
};

export default config;
