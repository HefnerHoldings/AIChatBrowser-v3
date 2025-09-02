import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Globe, Database, Download, Upload, Code, Lock, Eye } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  riskLevel: "low" | "medium" | "high";
}

interface DomainPermissions {
  domain: string;
  permissions: Permission[];
}

interface PermissionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDomain?: string;
  onPermissionsUpdate?: (permissions: DomainPermissions) => void;
}

export default function PermissionManager({ 
  open, 
  onOpenChange, 
  currentDomain = "google.com",
  onPermissionsUpdate 
}: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "browse",
      name: "Browse",
      description: "Navigate and view pages on this domain",
      icon: <Globe className="w-4 h-4" />,
      enabled: true,
      riskLevel: "low"
    },
    {
      id: "extract",
      name: "Extract Data",
      description: "Collect and parse information from pages",
      icon: <Database className="w-4 h-4" />,
      enabled: true,
      riskLevel: "low"
    },
    {
      id: "download",
      name: "Download Files",
      description: "Save files and documents from this domain",
      icon: <Download className="w-4 h-4" />,
      enabled: false,
      riskLevel: "medium"
    },
    {
      id: "upload",
      name: "Upload Files",
      description: "Submit files and forms with attachments",
      icon: <Upload className="w-4 h-4" />,
      enabled: false,
      riskLevel: "high"
    },
    {
      id: "execute",
      name: "Execute Scripts",
      description: "Run custom JavaScript on pages",
      icon: <Code className="w-4 h-4" />,
      enabled: false,
      riskLevel: "high"
    },
    {
      id: "authenticate",
      name: "Auto-Login",
      description: "Automatically fill login credentials",
      icon: <Lock className="w-4 h-4" />,
      enabled: false,
      riskLevel: "high"
    },
    {
      id: "observe",
      name: "Session Recording",
      description: "Record screenshots and DOM changes",
      icon: <Eye className="w-4 h-4" />,
      enabled: true,
      riskLevel: "low"
    }
  ]);

  const togglePermission = (id: string) => {
    const updated = permissions.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPermissions(updated);
    onPermissionsUpdate?.({ 
      domain: currentDomain, 
      permissions: updated 
    });
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const enabledCount = permissions.filter(p => p.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Permission Scopes for {currentDomain}
          </DialogTitle>
          <DialogDescription>
            Configure what MadEasy Browser can do on this domain. Higher risk permissions require explicit approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
            <span className="text-sm font-medium">
              {enabledCount} of {permissions.length} permissions enabled
            </span>
            <div className="flex gap-2">
              <Badge variant="outline">Low Risk: {permissions.filter(p => p.riskLevel === "low" && p.enabled).length}</Badge>
              <Badge variant="secondary">Medium Risk: {permissions.filter(p => p.riskLevel === "medium" && p.enabled).length}</Badge>
              <Badge variant="destructive">High Risk: {permissions.filter(p => p.riskLevel === "high" && p.enabled).length}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {permissions.map((permission) => (
              <Card key={permission.id} className={permission.enabled ? "border-primary/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {permission.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                            {permission.name}
                          </Label>
                          <Badge variant={getRiskBadgeVariant(permission.riskLevel)}>
                            {permission.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={permission.id}
                      checked={permission.enabled}
                      onCheckedChange={() => togglePermission(permission.id)}
                      data-testid={`switch-permission-${permission.id}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setPermissions(permissions.map(p => ({ ...p, enabled: p.riskLevel === "low" })));
                }}
              >
                Safe Mode
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Apply Permissions
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}