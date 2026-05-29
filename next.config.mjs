/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer and unpdf pull in optional native deps (canvas) we don't
  // bundle on the server; mark them external so webpack doesn't try to resolve them.
  serverExternalPackages: ["@react-pdf/renderer", "unpdf", "canvas"],
};

export default nextConfig;
