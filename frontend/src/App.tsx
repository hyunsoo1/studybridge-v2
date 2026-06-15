import { StoreProvider } from "@/lib/store";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Studies from "@/pages/Studies";
import StudyDetail from "@/pages/StudyDetail";
import CreateStudy from "@/pages/CreateStudy";
import EditStudy from "@/pages/EditStudy";
import My from "@/pages/My";
import Activity from "@/pages/Activity";
import Architecture from "@/pages/Architecture";
import MsaDemo from "@/pages/MsaDemo";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/studies" component={Studies} />
      <Route path="/studies/:id/edit" component={EditStudy} />
      <Route path="/studies/:id" component={StudyDetail} />
      <Route path="/create" component={CreateStudy} />
      <Route path="/my" component={My} />
      <Route path="/activity" component={Activity} />
      <Route path="/architecture" component={Architecture} />
      <Route path="/msa-demo" component={MsaDemo} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <StoreProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </StoreProvider>
  );
}

export default App;
