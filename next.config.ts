import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist'],
  // Force Vercel to include the pdfjs worker file in the serverless bundle.
  // Without this, Vercel's file tracing omits pdf.worker.js because it's
  // only loaded dynamically at runtime (not via static import analysis).
  outputFileTracingIncludes: {
    '/api/import': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.js'],
  },
};

export default nextConfig;
