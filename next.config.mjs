// next.config.mjs
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
    }
    return config;
  },
};

export default nextConfig;
