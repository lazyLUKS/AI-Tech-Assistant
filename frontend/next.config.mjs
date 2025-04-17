/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true, // Keep true for development checks

    // Option 1: Keep the rewrite for development convenience
    // The NEXT_PUBLIC_API_URL will primarily be used by the client-side code
    // The rewrite helps if you make server-side fetches within Next.js API routes (though you aren't currently)
    // OR if you want to avoid CORS issues during dev without configuring backend CORS extensively.
    // async rewrites() {
    //   // Ensure this doesn't conflict with your actual API paths if deploying together
    //   return [
    //     {
    //       // Ensure this matches the prefix used in backend/app/main.py's include_router
    //       source: '/api/v1/:path*',
    //       // Destination should match where the backend is running *from the perspective of the Next.js server*
    //       // If running locally (not in docker-compose network), localhost usually works.
    //       // If using docker-compose, use the service name (e.g., http://backend:8000)
    //       destination: 'http://localhost:8000/api/v1/:path*' // Adjust if needed (e.g., for Docker)
    //     }
    //   ];
    // },

    // Option 2: Remove rewrite if NEXT_PUBLIC_API_URL is sufficient and CORS is handled
    // Ensure your backend's CORS settings (in backend/app/main.py) correctly allow
    // the origin your frontend runs on (http://localhost:3000 for dev).
  };

  export default nextConfig;