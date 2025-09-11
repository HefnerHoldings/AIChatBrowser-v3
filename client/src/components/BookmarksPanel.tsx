import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Star, 
  Search, 
  Folder, 
  FolderOpen,
  Edit2, 
  Trash2, 
  MoreVertical,
  Plus,
  Download,
  Upload,
  Globe,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bookmark, InsertBookmark } from '@shared/schema';

interface BookmarksPanelProps {
  onBookmarkClick: (url: string) => void;
  onClose?: () => void;
}

interface BookmarksByFolder {
  [folder: string]: Bookmark[];
}

export function BookmarksPanel({ onBookmarkClick, onClose }: BookmarksPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InsertBookmark>>({});
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Uncategorized']));
  const [draggedBookmark, setDraggedBookmark] = useState<Bookmark | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey: ['/api/bookmarks'],
  });

  // Fetch folders
  const { data: folders = [] } = useQuery<string[]>({
    queryKey: ['/api/bookmarks/folders'],
  });

  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: (data: InsertBookmark) => apiRequest('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({ title: 'Bokmerke lagt til' });
    },
    onError: () => {
      toast({ title: 'Kunne ikke legge til bokmerke', variant: 'destructive' });
    },
  });

  // Update bookmark mutation
  const updateBookmarkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBookmark> }) =>
      apiRequest(`/api/bookmarks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({ title: 'Bokmerke oppdatert' });
      setShowEditDialog(false);
      setEditingBookmark(null);
    },
    onError: () => {
      toast({ title: 'Kunne ikke oppdatere bokmerke', variant: 'destructive' });
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/bookmarks/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({ title: 'Bokmerke slettet' });
    },
    onError: () => {
      toast({ title: 'Kunne ikke slette bokmerke', variant: 'destructive' });
    },
  });

  // Reorder bookmarks mutation
  const reorderBookmarksMutation = useMutation({
    mutationFn: ({ bookmarkIds, startPosition }: { bookmarkIds: string[]; startPosition: number }) =>
      apiRequest('/api/bookmarks/reorder', {
        method: 'POST',
        body: JSON.stringify({ bookmarkIds, startPosition }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  // Group bookmarks by folder
  const bookmarksByFolder = bookmarks.reduce<BookmarksByFolder>((acc, bookmark) => {
    const folder = bookmark.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(bookmark);
    return acc;
  }, {});

  // Filter bookmarks by search query
  const filteredBookmarksByFolder = Object.entries(bookmarksByFolder).reduce<BookmarksByFolder>((acc, [folder, bookmarks]) => {
    const filtered = bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[folder] = filtered;
    }
    return acc;
  }, {});

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setEditFormData({
      title: bookmark.title,
      url: bookmark.url,
      folder: bookmark.folder || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingBookmark) {
      updateBookmarkMutation.mutate({
        id: editingBookmark.id,
        data: editFormData,
      });
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setExpandedFolders(new Set([...expandedFolders, newFolderName]));
      setNewFolderName('');
      setShowNewFolderDialog(false);
      toast({ title: `Mappe "${newFolderName}" opprettet` });
    }
  };

  const handleDragStart = (e: React.DragEvent, bookmark: Bookmark) => {
    setDraggedBookmark(bookmark);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (folder: string) => {
    setDragOverFolder(folder);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (draggedBookmark && draggedBookmark.folder !== targetFolder) {
      updateBookmarkMutation.mutate({
        id: draggedBookmark.id,
        data: { folder: targetFolder === 'Uncategorized' ? null : targetFolder },
      });
    }
    setDraggedBookmark(null);
  };

  const handleExportBookmarks = () => {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Bokmerker eksportert' });
  };

  const handleImportBookmarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedBookmarks = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedBookmarks)) {
          for (const bookmark of importedBookmarks) {
            await createBookmarkMutation.mutateAsync({
              title: bookmark.title,
              url: bookmark.url,
              favicon: bookmark.favicon,
              folder: bookmark.folder,
            });
          }
          toast({ title: `${importedBookmarks.length} bokmerker importert` });
        }
      } catch (error) {
        toast({ title: 'Kunne ikke importere bokmerker', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-background" data-testid="bookmarks-panel">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Bokmerker</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-bookmarks-menu">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)} data-testid="button-new-folder">
                <Plus className="h-4 w-4 mr-2" />
                Ny mappe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportBookmarks} data-testid="button-export-bookmarks">
                <Download className="h-4 w-4 mr-2" />
                Eksporter bokmerker
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label data-testid="button-import-bookmarks">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer bokmerker
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBookmarks}
                    data-testid="input-import-file"
                  />
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i bokmerker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-bookmarks"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Laster bokmerker...</div>
          </div>
        ) : Object.keys(filteredBookmarksByFolder).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Ingen bokmerker funnet' : 'Ingen bokmerker ennå'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {Object.entries(filteredBookmarksByFolder).map(([folder, bookmarks]) => (
              <div
                key={folder}
                className={cn(
                  "rounded-lg border transition-colors",
                  dragOverFolder === folder && "border-primary bg-accent/50"
                )}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(folder)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder)}
                data-testid={`folder-${folder}`}
              >
                <Collapsible open={expandedFolders.has(folder)}>
                  <CollapsibleTrigger
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-t-lg"
                    data-testid={`button-toggle-folder-${folder}`}
                  >
                    {expandedFolders.has(folder) ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <FolderOpen className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        <Folder className="h-4 w-4" />
                      </>
                    )}
                    <span className="font-medium flex-1 text-left">{folder}</span>
                    <span className="text-xs text-muted-foreground">{bookmarks.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-2 pb-2">
                      {bookmarks.map((bookmark, index) => (
                        <div
                          key={bookmark.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, bookmark)}
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-move"
                          data-testid={`bookmark-${bookmark.id}`}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => onBookmarkClick(bookmark.url)}
                            className="flex items-center gap-2 flex-1 text-left"
                            data-testid={`button-open-bookmark-${bookmark.id}`}
                          >
                            {bookmark.favicon ? (
                              <img src={bookmark.favicon} alt="" className="h-4 w-4" />
                            ) : (
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{bookmark.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
                            </div>
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-bookmark-menu-${bookmark.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditBookmark(bookmark)} data-testid={`button-edit-bookmark-${bookmark.id}`}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rediger
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                                className="text-destructive"
                                data-testid={`button-delete-bookmark-${bookmark.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Edit Bookmark Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger bokmerke</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tittel</label>
              <Input
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={editFormData.url || ''}
                onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                data-testid="input-edit-url"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mappe</label>
              <Input
                value={editFormData.folder || ''}
                onChange={(e) => setEditFormData({ ...editFormData, folder: e.target.value })}
                placeholder="La stå tom for ukategorisert"
                data-testid="input-edit-folder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveEdit} data-testid="button-save-edit">
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny mappe</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Mappenavn"
            data-testid="input-new-folder-name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateFolder} data-testid="button-create-folder">
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}