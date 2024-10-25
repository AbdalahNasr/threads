// import { authMiddleware } from '@clerk/nextjs/server';

// export default authMiddleware({
//     publicRoutes : [ '/' , '/api/webhook/clerk'] ,
//     ignoredRoutes:['/api/webhook/clerk']
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware((auth, req) => {
 // Restrict admin route to users with specific role
 if (isAdminRoute(req)) auth().protect({ role: 'org:admin' })

 // Restrict dashboard routes to signed in users
 if (isDashboardRoute(req)) auth().protect()
})

export const config = {
 matcher: [
 '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
 '/(api|trpc)(.*)',
 ],
}