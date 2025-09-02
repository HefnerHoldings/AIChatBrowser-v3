import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, RefreshCw, Camera, Crosshair, Wand2 } from "lucide-react";

interface BrowserViewportProps {
  currentTaskId: string;
}

export default function BrowserViewport({ currentTaskId }: BrowserViewportProps) {
  const [url, setUrl] = useState("https://www.google.com/search?q=cookware+wholesaler+EU");

  return (
    <div className="flex-1 p-4">
      {/* Browser Controls */}
      <div className="flex items-center space-x-2 mb-4 p-3 bg-card/50 rounded-lg border border-border">
        <div className="flex items-center space-x-2 flex-1">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-forward">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 mx-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-input border-border"
              data-testid="input-url"
            />
          </div>
          
          <Button size="sm" data-testid="button-navigate">
            Go
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 border-l border-border pl-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="glassmorphism" 
            title="Auto-mode active"
            data-testid="button-auto-mode"
          >
            <Wand2 className="w-4 h-4 text-primary" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-screenshot">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-highlight">
            <Crosshair className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Browser Viewport */}
      <div className="border border-border rounded-lg overflow-hidden bg-white h-[calc(100vh-200px)] relative">
        {/* Simulated Google Search Results */}
        <div className="h-full p-6 overflow-y-auto">
          <div className="flex items-center mb-6">
            <div className="w-24 h-8 bg-blue-500 rounded mr-6 flex items-center justify-center text-white text-sm font-bold">
              Google
            </div>
            <div className="flex-1">
              <div className="w-full text-lg border rounded px-3 py-2 bg-gray-50">
                cookware wholesaler EU
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">About 2,340,000 results (0.47 seconds)</div>
          
          {/* Search Results with Extraction Overlays */}
          <div className="space-y-6">
            {/* Result 1 - Being Extracted */}
            <div className="relative p-4 border-2 border-blue-300 rounded-lg bg-blue-50/20">
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Extracting
              </div>
              <h3 className="text-xl text-blue-600 mb-1 cursor-pointer hover:underline">
                European Cookware Distributors Ltd
              </h3>
              <div className="text-green-600 text-sm mb-2">www.eu-cookware.com</div>
              <p className="text-gray-700 text-sm">
                Leading distributor of professional cookware across European markets. Contact us for wholesale pricing and bulk orders. Established since 1995...
              </p>
              <div className="mt-2 text-xs text-gray-500">
                📧 sales@eu-cookware.com • 📞 +49 30 12345678 • 🏢 Berlin, Germany
              </div>
            </div>
            
            {/* Result 2 - Normal */}
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 className="text-xl text-blue-600 mb-1 cursor-pointer hover:underline">
                Nordic Kitchen Supplies
              </h3>
              <div className="text-green-600 text-sm mb-2">www.nordickitchen.se</div>
              <p className="text-gray-700 text-sm">
                Scandinavian cookware wholesaler specializing in cast iron and stainless steel products. Serving retailers across Northern Europe...
              </p>
            </div>
            
            {/* Result 3 - Processing */}
            <div className="relative p-4 border-2 border-yellow-300 rounded-lg bg-yellow-50/20">
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                Processing
              </div>
              <h3 className="text-xl text-blue-600 mb-1 cursor-pointer hover:underline">
                Central European Trade Group
              </h3>
              <div className="text-green-600 text-sm mb-2">www.cetg.de</div>
              <p className="text-gray-700 text-sm">
                B2B marketplace connecting cookware manufacturers with European retailers. Premium kitchenware solutions for wholesale distribution...
              </p>
            </div>
            
            {/* More Results */}
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 className="text-xl text-blue-600 mb-1 cursor-pointer hover:underline">
                Italian Cookware Imports Ltd
              </h3>
              <div className="text-green-600 text-sm mb-2">www.italcook.it</div>
              <p className="text-gray-700 text-sm">
                Authentic Italian cookware for wholesale. Premium non-stick pans, pasta pots, and professional kitchen equipment...
              </p>
            </div>
          </div>
        </div>
        
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
