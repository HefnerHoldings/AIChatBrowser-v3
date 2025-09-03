import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Compass, Play, Rocket, User, Shield, Command, Globe } from "lucide-react";
import PermissionManager from "./permission-manager";
import CommandPalette from "./command-palette";

interface TopNavigationProps {
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  autonomyLevel: number;
  setAutonomyLevel: (level: number) => void;
}

export default function TopNavigation({ 
  currentProjectId, 
  setCurrentProjectId, 
  autonomyLevel, 
  setAutonomyLevel 
}: TopNavigationProps) {
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activePermissions] = useState(["Browse", "Extract", "Observe"]);
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const autonomyLevels = [
    { value: 0, label: "Level 0 - Manual" },
    { value: 1, label: "Level 1 - Co-pilot" },
    { value: 2, label: "Level 2 - Autopilot" },
    { value: 3, label: "Level 3 - PM Mode" },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Compass className="text-primary-foreground w-4 h-4" />
            </div>
            <span className="font-semibold text-lg">MadEasy Browser</span>
          </div>
          
          <div className="flex items-center space-x-2 ml-8">
            <Select value={currentProjectId} onValueChange={setCurrentProjectId}>
              <SelectTrigger className="w-64" data-testid="select-project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Permission Chips */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPermissionDialogOpen(true)}
              className="text-xs"
              data-testid="button-permissions"
            >
              <Shield className="w-4 h-4 mr-1" />
              Permissions:
            </Button>
            {activePermissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
          
          <div className="border-l border-border h-6" />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Autonomy:</span>
            <Select value={autonomyLevel.toString()} onValueChange={(value) => setAutonomyLevel(parseInt(value))}>
              <SelectTrigger className="w-48" data-testid="select-autonomy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {autonomyLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/browser">
              <Button 
                variant="outline" 
                size="sm"
                title="Åpne nettleser"
                data-testid="button-browser"
              >
                <Globe className="w-4 h-4 mr-1" />
                Nettleser
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCommandPaletteOpen(true)}
              title="Command Palette (Ctrl+K)"
              data-testid="button-command-palette"
            >
              <Command className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" data-testid="button-dry-run">
              <Play className="w-4 h-4 mr-1" />
              Dry Run
            </Button>
            <Button size="sm" data-testid="button-execute">
              <Rocket className="w-4 h-4 mr-1" />
              Execute
            </Button>
          </div>
          
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      <PermissionManager 
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
        currentDomain="google.com"
      />
      
      <CommandPalette 
        open={commandPaletteOpen}
        setOpen={setCommandPaletteOpen}
        onCommand={(cmd) => console.log('Command:', cmd)}
      />
    </header>
  );
}
