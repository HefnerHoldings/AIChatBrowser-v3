import { useState } from 'react';
import { 
  Folder, 
  Plus, 
  X, 
  Edit2, 
  ChevronDown, 
  ChevronRight,
  Palette,
  Users,
  Briefcase,
  ShoppingBag,
  Heart,
  Star,
  Home,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  groupId?: string;
}

interface TabGroup {
  id: string;
  name: string;
  color: string;
  icon?: string;
  collapsed?: boolean;
  tabs: string[]; // Tab IDs
}

interface TabGroupsProps {
  tabs: Tab[];
  groups: TabGroup[];
  activeTabId?: string;
  onGroupCreate: (group: Omit<TabGroup, 'id' | 'tabs'>) => void;
  onGroupUpdate: (groupId: string, updates: Partial<TabGroup>) => void;
  onGroupDelete: (groupId: string) => void;
  onTabMove: (tabId: string, groupId: string | null) => void;
  onTabSwitch: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const GROUP_COLORS = [
  { name: 'Grå', value: 'bg-gray-500' },
  { name: 'Rød', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Gul', value: 'bg-yellow-500' },
  { name: 'Grønn', value: 'bg-green-500' },
  { name: 'Blå', value: 'bg-blue-500' },
  { name: 'Lilla', value: 'bg-purple-500' },
  { name: 'Rosa', value: 'bg-pink-500' },
];

const GROUP_ICONS = [
  { name: 'Mappe', icon: Folder },
  { name: 'Brukere', icon: Users },
  { name: 'Arbeid', icon: Briefcase },
  { name: 'Handling', icon: ShoppingBag },
  { name: 'Favoritter', icon: Heart },
  { name: 'Stjerne', icon: Star },
  { name: 'Hjem', icon: Home },
  { name: 'Innstillinger', icon: Settings },
];

export function TabGroups({
  tabs,
  groups,
  activeTabId,
  onGroupCreate,
  onGroupUpdate,
  onGroupDelete,
  onTabMove,
  onTabSwitch,
  onTabClose
}: TabGroupsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState<string>('Folder');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  // Få faner som ikke er i noen gruppe
  const ungroupedTabs = tabs.filter(tab => !tab.groupId);

  const handleCreateGroup = () => {
    if (!newGroupName) return;
    
    onGroupCreate({
      name: newGroupName,
      color: selectedColor,
      icon: selectedIcon,
      collapsed: false
    });
    
    setNewGroupName('');
    setSelectedColor(GROUP_COLORS[0].value);
    setSelectedIcon('Folder');
    setIsCreateDialogOpen(false);
  };

  const handleGroupNameEdit = (groupId: string, newName: string) => {
    if (newName) {
      onGroupUpdate(groupId, { name: newName });
    }
    setEditingGroupId(null);
    setEditingName('');
  };

  const toggleGroupCollapse = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      onGroupUpdate(groupId, { collapsed: !group.collapsed });
    }
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    if (draggedTab) {
      onTabMove(draggedTab, groupId);
      setDraggedTab(null);
    }
  };

  const getGroupIcon = (iconName?: string) => {
    const IconComponent = GROUP_ICONS.find(i => i.name === iconName)?.icon || Folder;
    return <IconComponent className="w-3 h-3" />;
  };

  const renderTab = (tab: Tab, isInGroup = false) => (
    <div
      key={tab.id}
      draggable
      onDragStart={(e) => handleDragStart(e, tab.id)}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer transition-colors",
        activeTabId === tab.id && "bg-accent",
        isInGroup && "ml-4"
      )}
      onClick={() => onTabSwitch(tab.id)}
    >
      {tab.favicon && (
        <img src={tab.favicon} alt="" className="w-3 h-3" />
      )}
      <span className="text-xs truncate flex-1" title={tab.title}>
        {tab.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 opacity-0 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onTabClose(tab.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="w-64 bg-background border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Fanegrupper</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny fanegruppe</DialogTitle>
              <DialogDescription>
                Opprett en ny gruppe for å organisere fanene dine
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Navn</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Gruppenavn..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Farge</label>
                <div className="flex gap-2">
                  {GROUP_COLORS.map(color => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        color.value,
                        selectedColor === color.value && "scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary"
                      )}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Ikon</label>
                <div className="grid grid-cols-4 gap-2">
                  {GROUP_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      className={cn(
                        "p-2 rounded border transition-colors",
                        selectedIcon === name && "bg-accent border-primary"
                      )}
                      onClick={() => setSelectedIcon(name)}
                      title={name}
                    >
                      <Icon className="w-4 h-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleCreateGroup} className="w-full">
                Opprett gruppe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grupper og faner */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Ugrupperte faner */}
        {ungroupedTabs.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className="space-y-1"
          >
            <div className="text-xs text-muted-foreground px-2 py-1">
              Ugrupperte faner ({ungroupedTabs.length})
            </div>
            {ungroupedTabs.map(tab => renderTab(tab))}
          </div>
        )}

        {/* Grupper */}
        {groups.map(group => {
          const groupTabs = tabs.filter(tab => tab.groupId === group.id);
          
          return (
            <div
              key={group.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, group.id)}
              className="rounded-lg border overflow-hidden"
            >
              <ContextMenu>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors",
                      group.color.replace('bg-', 'bg-opacity-20 ')
                    )}
                    onClick={() => toggleGroupCollapse(group.id)}
                  >
                    <button className="p-0">
                      {group.collapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    <div className={cn("w-2 h-2 rounded-full", group.color)} />
                    {getGroupIcon(group.icon)}
                    
                    {editingGroupId === group.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleGroupNameEdit(group.id, editingName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleGroupNameEdit(group.id, editingName);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 text-xs flex-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium flex-1">{group.name}</span>
                    )}
                    
                    <Badge variant="secondary" className="text-xs h-5">
                      {groupTabs.length}
                    </Badge>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditingName(group.name);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rediger navn
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onGroupDelete(group.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett gruppe
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {!group.collapsed && (
                <div className="space-y-1 p-1">
                  {groupTabs.map(tab => renderTab(tab, true))}
                  {groupTabs.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Dra faner hit for å gruppere
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer statistikk */}
      <div className="p-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>{tabs.length} faner totalt</span>
          <span>{groups.length} grupper</span>
        </div>
      </div>
    </div>
  );
}