import { useState, createContext, useContext, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Favorites from "@/pages/Favorites";
import GameDetail from "@/pages/GameDetail";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/Sidebar";

const queryClient = new QueryClient();

export const SidebarCtx = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => { } });

export function useSidebar() {
  return useContext(SidebarCtx);
}

export const ThemeCtx = createContext<{
  dark: boolean;
  toggle: () => void;
}>({ dark: true, toggle: () => { } });

export function useTheme() {
  return useContext(ThemeCtx);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/admin" component={Admin} />
      <Route path="/game/:id" component={GameDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((v) => !v);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCtx.Provider value={{ dark, toggle }}>
        <SidebarCtx.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </WouterRouter>
        </SidebarCtx.Provider>
      </ThemeCtx.Provider>
    </QueryClientProvider>
  );
}

export default App;
