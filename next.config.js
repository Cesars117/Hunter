/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ready for subdomain deployment on cdsrsolutions.com
  // Set basePath if needed: basePath: '/taller',
  images: {
    domains: ['cdsrsolutions.com'],
  },
};

module.exports = nextConfig;
