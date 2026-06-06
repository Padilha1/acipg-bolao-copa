import { createRootRoute, createRoute } from "@tanstack/react-router";
import { AdminPage } from "./routes/admin";
import { HomePage } from "./routes/index";
import { LoginPage } from "./routes/login";
import { MatchesPage } from "./routes/matches";
import { RankingPage } from "./routes/ranking";
import { AppLayout } from "./routes/root";

const RootRoute = createRootRoute({
  component: AppLayout,
});

const Login = createRoute({
  path: "/login",
  getParentRoute: () => RootRoute,
  component: LoginPage,
});

const Index = createRoute({
  path: "/",
  getParentRoute: () => RootRoute,
  component: HomePage,
});

const Matches = createRoute({
  path: "/matches",
  getParentRoute: () => RootRoute,
  component: MatchesPage,
});

const Ranking = createRoute({
  path: "/ranking",
  getParentRoute: () => RootRoute,
  component: RankingPage,
});

const Admin = createRoute({
  path: "/admin",
  getParentRoute: () => RootRoute,
  component: AdminPage,
});

export const routeTree = RootRoute.addChildren([
  Index,
  Login,
  Matches,
  Ranking,
  Admin,
]);
