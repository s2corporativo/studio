import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/command-center"} component={Home} />
      <Route path={"/inteligencia"} component={Home} />
      <Route path={"/inbox"} component={Home} />
      <Route path={"/leads"} component={Home} />
      <Route path={"/concorrencia"} component={Home} />
      <Route path={"/analytics"} component={Home} />
      <Route path={"/compliance"}><Redirect to="/governanca" replace /></Route>
      <Route path={"/video"} component={Home} />
      <Route path={"/seo"} component={Home} />
      <Route path={"/ads"} component={Home} />
      <Route path={"/relatorios"} component={Home} />
      <Route path={"/agentes"} component={Home} />
      <Route path={"/memoria"} component={Home} />
      <Route path={"/governanca"} component={Home} />
      <Route path={"/conteudos"} component={Home} />
      <Route path={"/calendario"} component={Home} />
      <Route path={"/radar"} component={Home} />
      <Route path={"/automacao"} component={Home} />
      <Route path={"/redes"} component={Home} />
      <Route path={"/biblioteca"} component={Home} />
      <Route path={"/fontes"} component={Home} />
      <Route path={"/planejamento"} component={Home} />
      <Route path={"/conhecimento"} component={Home} />
      <Route path={"/instagram"} component={Home} />
      <Route path={"/roadmap"} component={Home} />
      <Route path={"/marca"} component={Home} />
      <Route path={"/socialhub"} component={Home} />
      <Route path={"/avancado"} component={Home} />
      <Route path={"/features-v2"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
