import type { NextConfig } from 'next';

const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // Force Vercel to include the pdfjs worker file in the serverless bundle
  outputFileTracingIncludes: {
    '/api/import': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  },
} satisfies NextConfig & { outputFileTracingIncludes?: Record<string, string[]> };

export default nextConfig;
