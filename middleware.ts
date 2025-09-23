// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/review(.*)',
  '/history(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  if (isProtectedRoute(req) && !userId) {
    // Send users to the Clerk sign-in and come back here after success
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Allow request to continue
  return;
});

// Protect everything except Next internals and static assets
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
