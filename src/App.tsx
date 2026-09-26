// The frame every screen sits in: a Shell header carrying the logotype, the
// app's name and the navigation, over a Panel main holding the routes. An
// error boundary around it all shows a danger alert with a reload button
// instead of a blank page.

import { Component, forwardRef, type ComponentPropsWithoutRef, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Link as RouterLink, Route, Routes, useLocation } from "react-router";
import {
  Alert,
  Button,
  Empty,
  Link,
  Logotype,
  Navigation,
  Panel,
  Prose,
  Row,
  Shell,
  Stack,
} from "@livetools/ui";
import type { NavigationItem } from "@livetools/ui";
import { HourRate } from "./screens/HourRate";

/** Where the app is served from: "/" locally, "/<repository>/" on GitHub Pages
 * without a custom domain. The router takes it without the trailing slash. */
const BASE = import.meta.env.BASE_URL;
const BASENAME = BASE.replace(/\/$/, "");

const SECTIONS = [
  { label: "Hour rate", href: "/" },
] as const;

/** React Router's Link takes `to`; the Navigation part hands its link component `href`. */
const NavLink = forwardRef<HTMLAnchorElement, Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string }>(
  function NavLink({ href, ...rest }, ref) {
    return <RouterLink ref={ref} to={href} {...rest} />;
  },
);

type BoundaryState = { failed: boolean };

/** React has no hook for catching a render fault, so this one piece is a class. */
class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Panel as="main" className="app-main">
        <Alert variant="danger" title="Something went wrong">
          <Stack gap="sm">
            <Prose>
              <p>This screen hit a fault and stopped. Reloading the page starts it again; edits made since the last reload are lost.</p>
            </Prose>
            <Row>
              <Button onClick={() => window.location.reload()}>Reload the page</Button>
            </Row>
          </Stack>
        </Alert>
      </Panel>
    );
  }
}

function Frame() {
  const { pathname } = useLocation();
  const items: readonly NavigationItem[] = SECTIONS.map((s) => ({ label: s.label, href: s.href, current: s.href === pathname }));
  return (
    <>
      <Shell className="app-band">
        <Row>
          <Logotype tone="white" />
          <span>scott-vite-test</span>
          <Navigation label="Sections" items={items} linkComponent={NavLink} />
        </Row>
      </Shell>
      <Panel as="main" className="app-main">
        <Routes>
          <Route path="/" element={<HourRate />} />
          <Route
            path="*"
            element={
              <Empty title="Nothing at this address">
                <Link href="/" linkComponent={NavLink} standalone>
                  Back to the hour rate
                </Link>
              </Empty>
            }
          />
        </Routes>
      </Panel>
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={BASENAME}>
        <Frame />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
