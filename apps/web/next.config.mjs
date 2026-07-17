/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sdd/engine"],
  experimental: {
    // O pacote @sdd/engine usa imports relativos com extensão ".js"
    // apontando para arquivos-fonte ".ts" (moduleResolution "Bundler").
    // O build (webpack — ver script "build" no package.json) precisa
    // desse alias para resolvê-los; Turbopack ainda não suporta
    // `experimental.extensionAlias` (ver next/dist/lib/turbopack-warning.js).
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
