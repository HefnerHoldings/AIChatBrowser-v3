import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

interface Tool {
  id: string;
  name: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface DraggableToolPanelProps {
  tools: Tool[];
  position: 'left' | 'right';
  className?: string;
}

function SortableToolItem({ tool, isDragging }: { tool: Tool; isDragging: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50"
      )}
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="pl-8">
        {tool.content}
      </div>
    </div>
  );
}

export function DraggableToolPanel({ tools, position, className }: DraggableToolPanelProps) {
  const { moveToolToPosition } = useSidebar();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(tools.map(t => t.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Oppdater tool posisjoner
        newItems.forEach((id, index) => {
          moveToolToPosition(id, position, index);
        });
        
        return newItems;
      });
    }
    
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2", className)}>
          {items.map((id) => {
            const tool = tools.find(t => t.id === id);
            if (!tool) return null;
            return (
              <SortableToolItem
                key={id}
                tool={tool}
                isDragging={activeId === id}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-80 bg-background rounded-lg shadow-lg p-2">
            {tools.find(t => t.id === activeId)?.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}