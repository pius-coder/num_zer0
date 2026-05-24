import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { RootDocument, rootHead } from './app/pages/layout'
import HomePage from './app/pages/home'
import AboutPage from './app/pages/about'
import TodosPage from './app/pages/todos'

const rootRoute = createRootRoute({
  head: rootHead,
  component: RootDocument,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const todosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos',
  component: TodosPage,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, todosRoute])

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
