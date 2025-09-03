import { useState, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, Copy, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SavedPassword } from '@shared/schema';

interface PasswordManagerProps {
  currentDomain?: string;
  onAutoFill?: (username: string, password: string) => void;
}

export function PasswordManager({ currentDomain, onAutoFill }: PasswordManagerProps) {
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState({
    domain: currentDomain || '',
    username: '',
    password: '',
    title: ''
  });

  // Hent lagrede passord
  const { data: passwords = [], refetch } = useQuery<SavedPassword[]>({
    queryKey: ['/api/saved-passwords'],
  });

  // Hent passord for nåværende domene
  const { data: domainPasswords = [] } = useQuery<SavedPassword[]>({
    queryKey: ['/api/saved-passwords/domain', currentDomain],
    enabled: !!currentDomain,
  });

  // Lagre passord mutation
  const savePasswordMutation = useMutation({
    mutationFn: async (data: typeof newPassword) => {
      return await apiRequest('/api/saved-passwords', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-passwords'] });
      setIsAddDialogOpen(false);
      setNewPassword({ domain: '', username: '', password: '', title: '' });
      toast({
        title: 'Passord lagret',
        description: 'Passordet er trygt lagret',
      });
    },
    onError: () => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre passord',
        variant: 'destructive',
      });
    }
  });

  // Slett passord mutation
  const deletePasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/saved-passwords/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-passwords'] });
      toast({
        title: 'Passord slettet',
        description: 'Passordet er fjernet',
      });
    }
  });

  // Filtrer passord basert på søk
  const filteredPasswords = passwords.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return p.domain.toLowerCase().includes(query) || 
           p.username.toLowerCase().includes(query) ||
           (p.title && p.title.toLowerCase().includes(query));
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} kopiert`,
      description: `${type} er kopiert til utklippstavlen`,
    });
  };

  const handleAutoFill = (password: SavedPassword) => {
    if (onAutoFill) {
      onAutoFill(password.username, password.password);
      toast({
        title: 'Auto-fylling utført',
        description: 'Brukernavn og passord er fylt inn',
      });
    }
  };

  const handleSavePassword = () => {
    if (!newPassword.domain || !newPassword.username || !newPassword.password) {
      toast({
        title: 'Feil',
        description: 'Vennligst fyll ut alle påkrevde felt',
        variant: 'destructive',
      });
      return;
    }
    savePasswordMutation.mutate(newPassword);
  };

  // Auto-fyll forslag for nåværende side
  useEffect(() => {
    if (domainPasswords.length === 1 && onAutoFill) {
      // Hvis det kun er ett passord for domenet, foreslå auto-fylling
      const password = domainPasswords[0];
      toast({
        title: 'Passord tilgjengelig',
        description: `Trykk for å fylle inn som ${password.username}`,
        action: (
          <Button
            size="sm"
            onClick={() => handleAutoFill(password)}
          >
            Fyll inn
          </Button>
        ),
      });
    }
  }, [domainPasswords, currentDomain]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Passordbehandling
        </h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Legg til passord
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til nytt passord</DialogTitle>
              <DialogDescription>
                Lagre et nytt passord trygt i nettleseren
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="domain">Nettsted/Domene</Label>
                <Input
                  id="domain"
                  value={newPassword.domain}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="example.com"
                />
              </div>
              <div>
                <Label htmlFor="username">Brukernavn/E-post</Label>
                <Input
                  id="username"
                  value={newPassword.username}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="bruker@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Passord</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword.password}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="title">Tittel (valgfri)</Label>
                <Input
                  id="title"
                  value={newPassword.title}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Min konto"
                />
              </div>
              <Button onClick={handleSavePassword} className="w-full">
                <Key className="w-4 h-4 mr-2" />
                Lagre passord
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Søkefelt */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Søk etter nettsted eller brukernavn..."
          className="pl-10"
        />
      </div>

      {/* Forslag for nåværende side */}
      {currentDomain && domainPasswords.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Passord for {currentDomain}
          </h3>
          <div className="space-y-2">
            {domainPasswords.map(password => (
              <div key={password.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {password.favicon && (
                    <img src={password.favicon} alt="" className="w-4 h-4" />
                  )}
                  <span className="font-medium">{password.username}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAutoFill(password)}
                >
                  Fyll inn
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passordliste */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredPasswords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen lagrede passord</p>
              <p className="text-sm mt-1">Legg til ditt første passord for å komme i gang</p>
            </div>
          ) : (
            filteredPasswords.map(password => (
              <div key={password.id} className="border rounded-lg p-3 hover:bg-accent/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {password.favicon && (
                        <img src={password.favicon} alt="" className="w-4 h-4" />
                      )}
                      <span className="font-medium">{password.domain}</span>
                      {password.title && (
                        <span className="text-sm text-muted-foreground">({password.title})</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Brukernavn:</span>
                        <span className="font-mono">{password.username}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(password.username, 'Brukernavn')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Passord:</span>
                        <span className="font-mono">
                          {showPasswords[password.id] ? password.password : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePasswordVisibility(password.id)}
                        >
                          {showPasswords[password.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(password.password, 'Passord')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Er du sikker på at du vil slette dette passordet?')) {
                        deletePasswordMutation.mutate(password.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}