import { Button } from "@/components/ui/button";
import { Camera, Crosshair, Wand2, AlertCircle } from "lucide-react";
import { BrowserNavigation } from "./browser-navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface BrowserViewportProps {
  currentTaskId: string;
  browserInstance?: any;
  activeTab?: any;
}

export default function BrowserViewport({ currentTaskId, browserInstance, activeTab }: BrowserViewportProps) {
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Hent screenshot fra backend hvis vi har en aktiv tab
  const { data: screenshot, refetch } = useQuery({
    queryKey: [`/api/browser-engine/instance/${browserInstance?.id}/tab/${activeTab?.id}/screenshot`],
    enabled: !!browserInstance?.id && !!activeTab?.id && activeTab?.url !== 'about:blank',
    refetchInterval: 2000, // Oppdater hvert 2. sekund
  });
  return (
    <div className="flex-1 p-4">
      {/* Browser Navigation */}
      <BrowserNavigation />
      
      {/* Automation Controls */}
      <div className="flex items-center justify-end space-x-2 mt-2 mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="glassmorphism" 
          title="Auto-mode active"
          data-testid="button-auto-mode"
        >
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="ml-1 text-xs">Auto Mode</span>
        </Button>
        <Button variant="ghost" size="sm" data-testid="button-screenshot">
          <Camera className="w-4 h-4" />
          <span className="ml-1 text-xs">Screenshot</span>
        </Button>
        <Button variant="ghost" size="sm" data-testid="button-highlight">
          <Crosshair className="w-4 h-4" />
          <span className="ml-1 text-xs">Selector</span>
        </Button>
      </div>
      
      {/* Browser Viewport */}
      <div className="border border-border rounded-lg overflow-hidden bg-white h-[calc(100vh-200px)] relative">
        {activeTab && activeTab.url !== 'about:blank' ? (
          screenshot ? (
            // Vis faktisk screenshot fra Puppeteer
            <img 
              src={`data:image/png;base64,${screenshot}`}
              alt="Browser content"
              className="w-full h-full object-contain bg-white"
            />
          ) : (
            // Loading state
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-4">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <div className="text-sm text-muted-foreground">Laster side...</div>
              </div>
            </div>
          )
        ) : (
          // Ny fane eller about:blank
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center space-y-4">
              <div className="text-6xl text-gray-300">🌐</div>
              <h2 className="text-2xl font-semibold text-gray-600">Ny fane</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Skriv inn en URL i adressefeltet eller velg et bokmerke for å starte nettlesing
              </p>
              
              {/* Hurtigtilgang */}
              <div className="mt-8 grid grid-cols-4 gap-4 max-w-md mx-auto">
                <button 
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  onClick={() => window.open('https://google.com', '_blank')}
                >
                  <div className="text-2xl mb-1">🔍</div>
                  <div className="text-xs text-gray-600">Google</div>
                </button>
                <button 
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  onClick={() => window.open('https://github.com', '_blank')}
                >
                  <div className="text-2xl mb-1">💻</div>
                  <div className="text-xs text-gray-600">GitHub</div>
                </button>
                <button 
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  onClick={() => window.open('https://linkedin.com', '_blank')}
                >
                  <div className="text-2xl mb-1">💼</div>
                  <div className="text-xs text-gray-600">LinkedIn</div>
                </button>
                <button 
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  onClick={() => window.open('https://replit.com', '_blank')}
                >
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs text-gray-600">Replit</div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Automation Status Overlay */}
        <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg p-3 glassmorphism">
          <div className="text-sm font-medium mb-2">Live Extraction</div>
          <div className="text-xs space-y-1">
            <div className="flex items-center">
              <span className="status-dot status-completed mr-2"></span>
              <span>Found 24 results</span>
            </div>
            <div className="flex items-center">
              <span className="status-dot status-running mr-2"></span>
              <span>Extracting contacts...</span>
            </div>
            <div className="flex items-center">
              <span className="status-dot status-pending mr-2"></span>
              <span>Validating data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
