/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Add this line to enable the standalone output
    output: 'standalone',

    // Optional rewrite section (keep commented out unless needed)
    // async rewrites() {
    //   // ...
    // }
  };

  export default nextConfig;
