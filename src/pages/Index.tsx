import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import DirectorDashboard from "@/components/dashboard/DirectorDashboard";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";

type UserRole = 'director' | 'worker' | null;

const Index = () => {
  const [user, setUser] = useState<UserRole>(null);

  const handleLogin = (role: UserRole) => {
    setUser(role);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (user === 'director') {
    return <DirectorDashboard onLogout={handleLogout} />;
  }

  if (user === 'worker') {
    return <WorkerDashboard onLogout={handleLogout} />;
  }

  return <LoginForm onLogin={handleLogin} />;
};

export default Index;
