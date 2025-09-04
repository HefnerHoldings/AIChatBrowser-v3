import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play,
  Save,
  FileCode2,
  Terminal,
  Monitor,
  Bug,
  GitBranch,
  Download,
  Upload,
  Settings,
  Layers,
  Code,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export function EditorRunner() {
  const [activeTab, setActiveTab] = useState<string>('file-1');
  const [files, setFiles] = useState<FileTab[]>([
    {
      id: 'file-1',
      name: 'index.tsx',
      path: '/src/index.tsx',
      content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello Vibecoding Platform!</h1>\n      <p>Build amazing things with AI assistance</p>\n    </div>\n  );\n}\n\nconst root = createRoot(document.getElementById('root')!);\nroot.render(<App />);`,
      language: 'typescript',
      modified: false
    },
    {
      id: 'file-2',
      name: 'server.py',
      path: '/api/server.py',
      content: `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str\n    price: float\n\n@app.get("/api/health")\nasync def health_check():\n    return {"status": "healthy"}\n\n@app.post("/api/items")\nasync def create_item(item: Item):\n    return {"message": f"Created {item.name}"}`,
      language: 'python',
      modified: false
    }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');
  const [selectedStack, setSelectedStack] = useState('react-typescript');

  const stacks = {
    'react-typescript': { name: 'React + TypeScript', icon: '⚛️', runner: 'vite' },
    'nextjs': { name: 'Next.js', icon: '▲', runner: 'next' },
    'python-fastapi': { name: 'FastAPI', icon: '🚀', runner: 'uvicorn' },
    'node-express': { name: 'Express.js', icon: '🟢', runner: 'node' },
    'dotnet-core': { name: '.NET Core', icon: '🟦', runner: 'dotnet' }
  };

  const runCode = async () => {
    setIsRunning(true);
    
    // Simulate code execution
    setTimeout(() => {
      setExecutionResult({
        stdout: '> vite dev\n\n  VITE v5.0.0  ready in 547 ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Network: http://192.168.1.100:3000/\n  ➜  press h + enter to show help',
        stderr: '',
        exitCode: 0,
        executionTime: 1234
      });
      setIsRunning(false);
    }, 2000);
  };

  const saveFile = () => {
    const currentFile = files.find(f => f.id === activeTab);
    if (currentFile) {
      setFiles(files.map(f => 
        f.id === activeTab ? { ...f, modified: false } : f
      ));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="border-b px-4 py-2 bg-secondary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Vibecoding Editor</span>
            </div>
            <Select value={selectedStack} onValueChange={setSelectedStack}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stacks).map(([key, stack]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{stack.icon}</span>
                      <span>{stack.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={saveFile}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline">
              <GitBranch className="h-4 w-4 mr-1" />
              Commit
            </Button>
            <Button 
              size="sm" 
              onClick={runCode}
              disabled={isRunning}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Run
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* File Explorer (Simplified) */}
        <div className="w-64 border-r bg-secondary/10">
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Project Files
            </h3>
          </div>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveTab(file.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-secondary/50 ${
                    activeTab === file.id ? 'bg-secondary' : ''
                  }`}
                >
                  <FileCode2 className="h-4 w-4" />
                  <span className="text-sm flex-1">{file.name}</span>
                  {file.modified && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          <div className="border-b bg-secondary/10">
            <div className="flex items-center">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveTab(file.id)}
                  className={`px-4 py-2 border-r flex items-center gap-2 cursor-pointer hover:bg-secondary/50 ${
                    activeTab === file.id ? 'bg-background border-b-2 border-b-blue-500' : ''
                  }`}
                >
                  <span className="text-sm">{file.name}</span>
                  {file.modified && <span className="text-amber-500">•</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Code Editor (Simplified representation) */}
          <div className="flex-1 flex">
            <div className="flex-1">
              <div className="h-full bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 overflow-auto">
                <pre>{files.find(f => f.id === activeTab)?.content}</pre>
              </div>
            </div>

            {/* Right Panel - Preview/Terminal */}
            <div className="w-[500px] border-l">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="rounded-none">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="debug" className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Debug
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 m-0">
                  <div className="h-full bg-white">
                    <div className="border-b px-3 py-2 bg-secondary/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Live
                        </Badge>
                        <span className="text-xs text-muted-foreground flex-1">
                          {previewUrl}
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <Monitor className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-8 text-center">
                      <div className="inline-flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Zap className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">Preview Ready</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          Your application will appear here when running.
                          Click Run to start the development server.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="terminal" className="flex-1 m-0">
                  <div className="h-full bg-black p-4">
                    <div className="font-mono text-sm space-y-2">
                      {executionResult ? (
                        <>
                          <div className="text-green-400">
                            {executionResult.stdout}
                          </div>
                          {executionResult.stderr && (
                            <div className="text-red-400">
                              {executionResult.stderr}
                            </div>
                          )}
                          <div className="text-gray-500 text-xs mt-4">
                            Process exited with code {executionResult.exitCode} 
                            ({executionResult.executionTime}ms)
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">
                          $ Ready to execute commands...
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="debug" className="flex-1 m-0">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Breakpoints</h4>
                      <div className="text-sm text-muted-foreground">
                        No breakpoints set
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Call Stack</h4>
                      <div className="text-sm text-muted-foreground">
                        Not debugging
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Variables</h4>
                      <div className="text-sm text-muted-foreground">
                        Start debugging to inspect variables
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-secondary/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Ready
          </span>
          <span className="text-muted-foreground">
            {files.find(f => f.id === activeTab)?.language}
          </span>
          <span className="text-muted-foreground">UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Ln 15, Col 22</span>
          <span className="text-muted-foreground">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}