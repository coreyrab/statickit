/**
 * Convex Auth Configuration
 *
 * This configures Convex to use Clerk for authentication.
 * Clerk JWTs are validated by Convex, allowing us to securely
 * identify users in our backend functions.
 *
 * Set CLERK_JWT_ISSUER_DOMAIN in your environment:
 * - Development: https://your-dev-instance.clerk.accounts.dev
 * - Production: https://your-prod-instance.clerk.accounts.dev
 */

const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkDomain) {
  console.warn("CLERK_JWT_ISSUER_DOMAIN not set - Clerk authentication may not work");
}

export default {
  providers: [
    {
      domain: clerkDomain || "https://clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
