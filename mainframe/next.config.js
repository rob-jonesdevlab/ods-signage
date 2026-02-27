/** @type {import('next').NextConfig} */
const nextConfig = {
    // IMPORTANT: Do NOT use output: 'export'
    // Our app requires server-side rendering for authentication
    // Using 'standalone' enables Server Components and dynamic rendering
    output: 'standalone',

    // Ensure React strict mode is enabled
    reactStrictMode: true,
}

module.exports = nextConfig
