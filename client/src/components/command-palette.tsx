import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Globe, 
  Download, 
  FileSpreadsheet, 
  Play, 
  Pause, 
  Settings, 
  Shield,
  Eye,
  Code,
  Database,
  Rocket,
  Plus,
  Search,
  FileText,
  Upload
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCommand?: (command: string) => void;
}

export default function CommandPalette({ open, setOpen, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: string) => {
    setOpen(false);
    onCommand?.(command);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand("new-task")} data-testid="cmd-new-task">
            <Plus className="mr-2 h-4 w-4" />
            <span>New Automation Task</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("execute")} data-testid="cmd-execute">
            <Rocket className="mr-2 h-4 w-4" />
            <span>Execute Current Task</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("pause")} data-testid="cmd-pause">
            <Pause className="mr-2 h-4 w-4" />
            <span>Pause Execution</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand("browser-view")} data-testid="cmd-browser">
            <Globe className="mr-2 h-4 w-4" />
            <span>Browser View</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("workflow-editor")} data-testid="cmd-workflow">
            <Code className="mr-2 h-4 w-4" />
            <span>Workflow Editor</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("data-dashboard")} data-testid="cmd-data">
            <Database className="mr-2 h-4 w-4" />
            <span>Data Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("dev-console")} data-testid="cmd-dev">
            <Code className="mr-2 h-4 w-4" />
            <span>Dev Console</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Data Operations">
          <CommandItem onSelect={() => runCommand("export-csv")} data-testid="cmd-export-csv">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Export to CSV</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("export-xlsx")} data-testid="cmd-export-xlsx">
            <Download className="mr-2 h-4 w-4" />
            <span>Export to XLSX</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("generate-report")} data-testid="cmd-report">
            <FileText className="mr-2 h-4 w-4" />
            <span>Generate Report</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Automation">
          <CommandItem onSelect={() => runCommand("search-web")} data-testid="cmd-search">
            <Search className="mr-2 h-4 w-4" />
            <span>Search Web</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("extract-data")} data-testid="cmd-extract">
            <Database className="mr-2 h-4 w-4" />
            <span>Extract Data from Page</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("fill-form")} data-testid="cmd-form">
            <Upload className="mr-2 h-4 w-4" />
            <span>Fill Form</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("take-screenshot")} data-testid="cmd-screenshot">
            <Eye className="mr-2 h-4 w-4" />
            <span>Take Screenshot</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand("permissions")} data-testid="cmd-permissions">
            <Shield className="mr-2 h-4 w-4" />
            <span>Permission Scopes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("settings")} data-testid="cmd-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("session-replay")} data-testid="cmd-replay">
            <Play className="mr-2 h-4 w-4" />
            <span>Session Replay</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}