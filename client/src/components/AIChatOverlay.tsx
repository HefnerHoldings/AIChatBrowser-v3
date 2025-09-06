import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function AIChatOverlay() {
  const { config, toggleAIChatOverlay } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Åpne chat med hurtigtast (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Vis ikke overlay hvis chat er aktiv i sidemeny
  if (!config.showAIChatOverlay) {
    return null;
  }

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler AI-respons
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Jeg analyserer forespørselen din og forbereder et svar...',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Flytende ikon */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-0"
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6 text-white" />
                <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </Button>
            <div className="absolute -top-8 right-0 text-xs bg-black/75 text-white px-2 py-1 rounded whitespace-nowrap">
              AI Chat (Ctrl+K)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat vindu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: isMinimized ? 0.9 : 1, 
              y: 0,
              height: isMinimized ? 80 : 600
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-50",
              "bottom-6 right-6",
              "w-[400px]",
              "shadow-2xl rounded-lg overflow-hidden",
              "bg-background/95 backdrop-blur-lg border"
            )}
          >
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-purple-600/10 to-blue-600/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Assistent</h3>
                      <p className="text-xs text-muted-foreground">Alltid klar til å hjelpe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Meldinger */}
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Hei! Jeg er din AI-assistent. 
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Still meg spørsmål eller be om hjelp med oppgaver.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setInput('Hjelp meg med å automatisere en oppgave')}
                          >
                            Automatisering
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80" 
                            onClick={() => setInput('Analyser denne nettsiden')}
                          >
                            Analyse
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setInput('Lag en workflow')}
                          >
                            Workflow
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map(msg => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex",
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-lg",
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            )}>
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {msg.timestamp.toLocaleTimeString('nb-NO', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-100" />
                                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-200" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Skriv din melding..."
                        className="flex-1"
                        disabled={isTyping}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Trykk Esc for å lukke • Ctrl+K for å åpne
                    </p>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}