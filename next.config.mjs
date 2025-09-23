// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = require.resolve('pdfjs-dist/build/pdf.worker.js');
    return config;
  },
};

export default nextConfig;
