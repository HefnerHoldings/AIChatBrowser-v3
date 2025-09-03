import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to the browser page
    setLocation("/browser");
  }, [setLocation]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Omdirigerer til nettleseren...</p>
    </div>
  );
}