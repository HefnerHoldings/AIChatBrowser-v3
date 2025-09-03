import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  User,
  Mail,
  Lock,
  Shield,
  Key,
  UserPlus,
  LogIn,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Smartphone,
  Settings,
  CreditCard,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  verified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  apiKeys: number;
  pluginsCreated: number;
}

export function UserAuthentication() {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [userProfile] = useState<UserProfile>({
    id: "user-123",
    email: "demo@madeasy.com",
    name: "Demo User",
    plan: "pro",
    verified: true,
    twoFactorEnabled: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    apiKeys: 2,
    pluginsCreated: 5
  });

  const handleLogin = () => {
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoggedIn(true);
    toast({
      title: "Welcome back!",
      description: "You have successfully logged in",
    });
  };

  const handleRegister = () => {
    if (!registerEmail || !registerPassword || !registerName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoggedIn(true);
    toast({
      title: "Account created!",
      description: "Welcome to MadEasy Browser",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise": return <Badge className="bg-purple-500">Enterprise</Badge>;
      case "pro": return <Badge className="bg-blue-500">Pro</Badge>;
      default: return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to MadEasy Browser</CardTitle>
            <CardDescription>
              Sign in or create an account for full access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    data-testid="input-login-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-login-password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="link" className="px-0">
                    Forgot password?
                  </Button>
                  <Button variant="link" className="px-0">
                    Use 2FA
                  </Button>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleLogin}
                  data-testid="button-login"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">Google</Button>
                  <Button variant="outline">GitHub</Button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    placeholder="John Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    data-testid="input-register-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    data-testid="input-register-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    data-testid="input-register-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Free tier includes 100 automation runs per month
                  </AlertDescription>
                </Alert>

                <Button 
                  className="w-full" 
                  onClick={handleRegister}
                  data-testid="button-register"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </div>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Log Out
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your account and subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="developer">Developer</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xl font-bold">
                    {userProfile.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-lg font-medium">{userProfile.name}</div>
                    <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getPlanBadge(userProfile.plan)}
                      {userProfile.verified && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={userProfile.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={userProfile.email} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea 
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button>Save Changes</Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-xs text-muted-foreground">
                        Add an extra layer of security
                      </div>
                    </div>
                  </div>
                  <Switch checked={userProfile.twoFactorEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <div className="font-medium">SMS Alerts</div>
                      <div className="text-xs text-muted-foreground">
                        Get notified about important account activity
                      </div>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                  <Button>Update Password</Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Last login: Today at 2:15 PM from Chrome on Windows
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-primary">
                  <CardContent className="p-4">
                    <div className="text-lg font-medium">Free</div>
                    <div className="text-2xl font-bold">$0</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                    <ul className="mt-3 space-y-1 text-xs">
                      <li>• 100 automation runs</li>
                      <li>• 1 project</li>
                      <li>• Community support</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-medium">Pro</div>
                      <Crown className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">$29</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                    <ul className="mt-3 space-y-1 text-xs">
                      <li>• Unlimited runs</li>
                      <li>• 10 projects</li>
                      <li>• Priority support</li>
                      <li>• Advanced features</li>
                    </ul>
                    <Badge className="mt-2">Current Plan</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary">
                  <CardContent className="p-4">
                    <div className="text-lg font-medium">Enterprise</div>
                    <div className="text-2xl font-bold">Custom</div>
                    <div className="text-xs text-muted-foreground">contact sales</div>
                    <ul className="mt-3 space-y-1 text-xs">
                      <li>• Unlimited everything</li>
                      <li>• Custom integrations</li>
                      <li>• Dedicated support</li>
                      <li>• SLA guarantee</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">•••• •••• •••• 4242</div>
                        <div className="text-xs text-muted-foreground">Expires 12/25</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Update</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="developer" className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  API keys allow you to integrate MadEasy Browser with external services
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Keys ({userProfile.apiKeys})</span>
                  <Button size="sm">
                    <Key className="h-3 w-3 mr-1" />
                    Generate New Key
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          mad_live_k3y_••••••••••••••••
                        </code>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created 2 weeks ago • Last used yesterday
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">Revoke</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Your Plugins ({userProfile.pluginsCreated})
                  </span>
                  <Button size="sm" variant="outline">
                    View in Marketplace
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Member since {userProfile.createdAt.toLocaleDateString()}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}