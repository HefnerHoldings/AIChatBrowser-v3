import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import * as Y from 'yjs';
import { db } from '../db';
import { syncStates, syncOperations } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getWebSocketServer } from './websocket-server';

// Operation Types
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  UPDATE = 'update',
  MOVE = 'move',
  FORMAT = 'format',
}

// Sync Modes
export enum SyncMode {
  OPTIMISTIC = 'optimistic',
  PESSIMISTIC = 'pessimistic',
  EVENTUAL = 'eventual',
}

// Document Types
export enum DocumentType {
  TEXT = 'text',
  JSON = 'json',
  BINARY = 'binary',
  WORKFLOW = 'workflow',
  CODE = 'code',
}

// Operation Interface
export interface Operation {
  id: string;
  type: OperationType;
  documentId: string;
  documentType: DocumentType;
  userId: string;
  timestamp: number;
  position?: number;
  length?: number;
  content?: any;
  attributes?: Record<string, any>;
  parentVersion: number;
  checksum?: string;
}

// Transform Result
interface TransformResult {
  operation1: Operation;
  operation2: Operation;
  conflict: boolean;
}

// Document State
interface DocumentState {
  id: string;
  type: DocumentType;
  version: number;
  content: any;
  checksum: string;
  lastModified: Date;
  operations: Operation[];
  ydoc?: Y.Doc;
  subscribers: Set<string>;
  locks: Map<string, DocumentLock>;
}

// Document Lock
interface DocumentLock {
  userId: string;
  range: { start: number; end: number };
  timestamp: number;
  exclusive: boolean;
}

// Sync Session
interface SyncSession {
  id: string;
  documentId: string;
  userId: string;
  mode: SyncMode;
  startTime: Date;
  lastSync: Date;
  pendingOperations: Operation[];
  acknowledged: Set<string>;
}

// Real-time Sync Service
export class SyncService extends EventEmitter {
  private documents: Map<string, DocumentState> = new Map();
  private sessions: Map<string, SyncSession> = new Map();
  private operationQueue: Map<string, Operation[]> = new Map();
  private conflictResolutionStrategies: Map<string, ConflictResolutionStrategy> = new Map();
  private compressionEnabled: boolean = true;
  private maxOperationHistory: number = 1000;

  constructor() {
    super();
    this.initializeStrategies();
    this.startPeriodicSync();
  }

  private initializeStrategies(): void {
    // Default conflict resolution strategies
    this.conflictResolutionStrategies.set('last-write-wins', new LastWriteWinsStrategy());
    this.conflictResolutionStrategies.set('merge', new MergeStrategy());
    this.conflictResolutionStrategies.set('manual', new ManualResolutionStrategy());
  }

  // Create or get document
  public async getDocument(documentId: string, type: DocumentType): Promise<DocumentState> {
    if (this.documents.has(documentId)) {
      return this.documents.get(documentId)!;
    }

    // Load from database
    const [state] = await db
      .select()
      .from(syncStates)
      .where(eq(syncStates.documentId, documentId))
      .limit(1);

    let document: DocumentState;

    if (state) {
      // Restore from database
      document = {
        id: documentId,
        type,
        version: state.version,
        content: state.content,
        checksum: state.checksum,
        lastModified: state.updatedAt,
        operations: [],
        subscribers: new Set(),
        locks: new Map(),
      };

      // Load recent operations
      const ops = await db
        .select()
        .from(syncOperations)
        .where(
          and(
            eq(syncOperations.documentId, documentId),
            gte(syncOperations.version, Math.max(0, state.version - 100))
          )
        )
        .orderBy(syncOperations.version);

      document.operations = ops.map(op => ({
        id: op.id,
        type: op.type as OperationType,
        documentId: op.documentId,
        documentType: type,
        userId: op.userId,
        timestamp: op.timestamp.getTime(),
        position: op.position || undefined,
        length: op.length || undefined,
        content: op.content,
        attributes: op.attributes || {},
        parentVersion: op.parentVersion,
        checksum: op.checksum || undefined,
      }));
    } else {
      // Create new document
      document = {
        id: documentId,
        type,
        version: 0,
        content: this.getInitialContent(type),
        checksum: '',
        lastModified: new Date(),
        operations: [],
        subscribers: new Set(),
        locks: new Map(),
      };

      // Initialize CRDT if needed
      if (type === DocumentType.TEXT || type === DocumentType.CODE) {
        document.ydoc = new Y.Doc();
        document.ydoc.clientID = Math.floor(Math.random() * 1000000);
      }

      document.checksum = this.calculateChecksum(document.content);

      // Save to database
      await db.insert(syncStates).values({
        documentId,
        documentType: type,
        version: 0,
        content: document.content,
        checksum: document.checksum,
        updatedAt: new Date(),
      });
    }

    this.documents.set(documentId, document);
    return document;
  }

  // Apply operation with Operational Transform
  public async applyOperation(operation: Operation): Promise<void> {
    const document = await this.getDocument(operation.documentId, operation.documentType);

    // Check for conflicts
    if (operation.parentVersion < document.version) {
      // Transform operation against concurrent operations
      const transformedOp = await this.transformOperation(operation, document);
      operation = transformedOp;
    }

    // Apply optimistic update
    if (this.isOptimisticMode(operation.userId)) {
      this.applyOptimisticUpdate(document, operation);
    }

    // Transform and apply
    try {
      // Apply to CRDT if available
      if (document.ydoc) {
        this.applyCRDTOperation(document.ydoc, operation);
      } else {
        // Apply traditional OT
        this.applyOTOperation(document, operation);
      }

      // Update document state
      document.version++;
      document.lastModified = new Date();
      document.operations.push(operation);
      
      // Trim operation history
      if (document.operations.length > this.maxOperationHistory) {
        document.operations = document.operations.slice(-this.maxOperationHistory);
      }

      // Calculate new checksum
      document.checksum = this.calculateChecksum(document.content);

      // Persist to database
      await this.persistOperation(operation, document);

      // Broadcast to subscribers
      this.broadcastOperation(document, operation);

      // Emit success event
      this.emit('operation-applied', {
        documentId: operation.documentId,
        operation,
        version: document.version,
      });
    } catch (error) {
      // Rollback on error
      await this.rollbackOperation(document, operation);
      
      this.emit('operation-failed', {
        documentId: operation.documentId,
        operation,
        error,
      });
      
      throw error;
    }
  }

  // Transform operation against concurrent operations
  private async transformOperation(operation: Operation, document: DocumentState): Promise<Operation> {
    const concurrentOps = document.operations.filter(
      op => op.parentVersion >= operation.parentVersion && op.id !== operation.id
    );

    let transformedOp = { ...operation };

    for (const concurrentOp of concurrentOps) {
      const result = this.transform(transformedOp, concurrentOp);
      transformedOp = result.operation1;
    }

    return transformedOp;
  }

  // Operational Transform implementation
  private transform(op1: Operation, op2: Operation): TransformResult {
    // Simplified OT - would need more complex logic for production
    const result: TransformResult = {
      operation1: { ...op1 },
      operation2: { ...op2 },
      conflict: false,
    };

    if (op1.type === OperationType.INSERT && op2.type === OperationType.INSERT) {
      if (op1.position! < op2.position!) {
        // op1 comes before op2, no change needed
      } else if (op1.position! > op2.position!) {
        // Adjust op1 position
        result.operation1.position! += op2.length || 0;
      } else {
        // Same position - use userId as tiebreaker
        if (op1.userId < op2.userId) {
          result.operation2.position! += op1.length || 0;
        } else {
          result.operation1.position! += op2.length || 0;
        }
        result.conflict = true;
      }
    } else if (op1.type === OperationType.DELETE && op2.type === OperationType.DELETE) {
      if (op1.position! < op2.position!) {
        result.operation2.position! -= op1.length || 0;
      } else if (op1.position! > op2.position!) {
        result.operation1.position! -= op2.length || 0;
      } else {
        // Overlapping deletes
        result.conflict = true;
      }
    } else if (op1.type === OperationType.INSERT && op2.type === OperationType.DELETE) {
      if (op1.position! <= op2.position!) {
        result.operation2.position! += op1.length || 0;
      } else if (op1.position! > op2.position! + (op2.length || 0)) {
        result.operation1.position! -= op2.length || 0;
      } else {
        // Insert within delete range
        result.conflict = true;
      }
    } else if (op1.type === OperationType.DELETE && op2.type === OperationType.INSERT) {
      if (op2.position! <= op1.position!) {
        result.operation1.position! += op2.length || 0;
      } else if (op2.position! >= op1.position! + (op1.length || 0)) {
        result.operation2.position! -= op1.length || 0;
      } else {
        // Insert within delete range
        result.conflict = true;
      }
    }

    return result;
  }

  // Apply CRDT operation (Yjs)
  private applyCRDTOperation(ydoc: Y.Doc, operation: Operation): void {
    const ytext = ydoc.getText('content');

    switch (operation.type) {
      case OperationType.INSERT:
        if (operation.position !== undefined && operation.content) {
          ytext.insert(operation.position, operation.content);
        }
        break;

      case OperationType.DELETE:
        if (operation.position !== undefined && operation.length) {
          ytext.delete(operation.position, operation.length);
        }
        break;

      case OperationType.FORMAT:
        if (operation.position !== undefined && operation.length && operation.attributes) {
          ytext.format(operation.position, operation.length, operation.attributes);
        }
        break;
    }
  }

  // Apply traditional OT operation
  private applyOTOperation(document: DocumentState, operation: Operation): void {
    switch (operation.type) {
      case OperationType.INSERT:
        if (typeof document.content === 'string') {
          const before = document.content.substring(0, operation.position);
          const after = document.content.substring(operation.position!);
          document.content = before + operation.content + after;
        } else if (Array.isArray(document.content)) {
          document.content.splice(operation.position!, 0, operation.content);
        }
        break;

      case OperationType.DELETE:
        if (typeof document.content === 'string') {
          const before = document.content.substring(0, operation.position);
          const after = document.content.substring(operation.position! + operation.length!);
          document.content = before + after;
        } else if (Array.isArray(document.content)) {
          document.content.splice(operation.position!, operation.length!);
        }
        break;

      case OperationType.UPDATE:
        if (operation.position !== undefined) {
          if (Array.isArray(document.content)) {
            document.content[operation.position] = operation.content;
          } else if (typeof document.content === 'object') {
            const keys = Object.keys(operation.content);
            keys.forEach(key => {
              document.content[key] = operation.content[key];
            });
          }
        }
        break;
    }
  }

  // Apply optimistic update
  private applyOptimisticUpdate(document: DocumentState, operation: Operation): void {
    // Store operation in pending queue
    const userId = operation.userId;
    if (!this.operationQueue.has(userId)) {
      this.operationQueue.set(userId, []);
    }
    this.operationQueue.get(userId)!.push(operation);

    // Apply immediately to local state
    this.emit('optimistic-update', {
      documentId: document.id,
      operation,
      localOnly: true,
    });
  }

  // Rollback operation
  private async rollbackOperation(document: DocumentState, operation: Operation): Promise<void> {
    // Find inverse operation
    const inverseOp = this.getInverseOperation(operation);
    
    // Apply inverse
    await this.applyOperation(inverseOp);

    // Remove from queue
    const queue = this.operationQueue.get(operation.userId);
    if (queue) {
      const index = queue.findIndex(op => op.id === operation.id);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }

    this.emit('rollback', {
      documentId: document.id,
      operation,
      reason: 'conflict',
    });
  }

  // Get inverse operation for rollback
  private getInverseOperation(operation: Operation): Operation {
    const inverse: Operation = {
      ...operation,
      id: `inverse-${operation.id}`,
      timestamp: Date.now(),
    };

    switch (operation.type) {
      case OperationType.INSERT:
        inverse.type = OperationType.DELETE;
        inverse.length = operation.content?.length || operation.length;
        inverse.content = undefined;
        break;

      case OperationType.DELETE:
        inverse.type = OperationType.INSERT;
        inverse.content = operation.content; // Assuming we stored deleted content
        break;

      case OperationType.UPDATE:
        // Would need to store previous value for proper inverse
        break;
    }

    return inverse;
  }

  // Persist operation to database
  private async persistOperation(operation: Operation, document: DocumentState): Promise<void> {
    await db.transaction(async (tx) => {
      // Save operation
      await tx.insert(syncOperations).values({
        id: operation.id,
        documentId: operation.documentId,
        type: operation.type,
        userId: operation.userId,
        timestamp: new Date(operation.timestamp),
        position: operation.position,
        length: operation.length,
        content: operation.content,
        attributes: operation.attributes,
        parentVersion: operation.parentVersion,
        version: document.version,
        checksum: operation.checksum,
      });

      // Update document state
      await tx
        .update(syncStates)
        .set({
          version: document.version,
          content: document.content,
          checksum: document.checksum,
          updatedAt: new Date(),
        })
        .where(eq(syncStates.documentId, document.id));
    });
  }

  // Broadcast operation to subscribers
  private broadcastOperation(document: DocumentState, operation: Operation): void {
    const wsServer = getWebSocketServer();
    if (!wsServer) return;

    document.subscribers.forEach(userId => {
      if (userId !== operation.userId) {
        wsServer.sendToUser(userId, {
          id: `sync-${Date.now()}`,
          namespace: '/collaboration',
          event: 'sync-operation',
          data: {
            documentId: document.id,
            operation,
            version: document.version,
          },
          timestamp: Date.now(),
        });
      }
    });
  }

  // Subscribe to document updates
  public subscribeToDocument(documentId: string, userId: string): void {
    const document = this.documents.get(documentId);
    if (document) {
      document.subscribers.add(userId);
    }
  }

  // Unsubscribe from document
  public unsubscribeFromDocument(documentId: string, userId: string): void {
    const document = this.documents.get(documentId);
    if (document) {
      document.subscribers.delete(userId);
      
      // Clean up if no subscribers
      if (document.subscribers.size === 0) {
        this.documents.delete(documentId);
      }
    }
  }

  // Lock document range
  public async lockRange(
    documentId: string, 
    userId: string, 
    start: number, 
    end: number, 
    exclusive: boolean = false
  ): Promise<boolean> {
    const document = await this.getDocument(documentId, DocumentType.TEXT);
    
    // Check for conflicts
    for (const [lockUserId, lock] of document.locks) {
      if (lockUserId === userId) continue;
      
      if (lock.exclusive || exclusive) {
        // Check for overlap
        if (!(end < lock.range.start || start > lock.range.end)) {
          return false; // Conflict
        }
      }
    }

    // Add lock
    document.locks.set(userId, {
      userId,
      range: { start, end },
      timestamp: Date.now(),
      exclusive,
    });

    // Broadcast lock update
    this.broadcastLockUpdate(document, userId, { start, end }, 'lock');

    return true;
  }

  // Unlock document range
  public async unlockRange(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    const lock = document.locks.get(userId);
    if (lock) {
      document.locks.delete(userId);
      this.broadcastLockUpdate(document, userId, lock.range, 'unlock');
    }
  }

  // Broadcast lock update
  private broadcastLockUpdate(
    document: DocumentState, 
    userId: string, 
    range: { start: number; end: number }, 
    action: 'lock' | 'unlock'
  ): void {
    const wsServer = getWebSocketServer();
    if (!wsServer) return;

    document.subscribers.forEach(subscriberId => {
      wsServer.sendToUser(subscriberId, {
        id: `lock-${Date.now()}`,
        namespace: '/collaboration',
        event: 'lock-update',
        data: {
          documentId: document.id,
          userId,
          range,
          action,
        },
        timestamp: Date.now(),
      });
    });
  }

  // Get document snapshot
  public async getSnapshot(documentId: string, version?: number): Promise<any> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    if (version === undefined || version === document.version) {
      return {
        content: document.content,
        version: document.version,
        checksum: document.checksum,
      };
    }

    // Reconstruct historical version
    const historicalContent = await this.reconstructVersion(document, version);
    return {
      content: historicalContent,
      version,
      checksum: this.calculateChecksum(historicalContent),
    };
  }

  // Reconstruct historical version
  private async reconstructVersion(document: DocumentState, targetVersion: number): Promise<any> {
    // Load operations up to target version
    const operations = await db
      .select()
      .from(syncOperations)
      .where(
        and(
          eq(syncOperations.documentId, document.id),
          gte(syncOperations.version, 0),
          lte(syncOperations.version, targetVersion)
        )
      )
      .orderBy(syncOperations.version);

    // Apply operations sequentially
    let content = this.getInitialContent(document.type);
    const tempDoc = { ...document, content };

    for (const op of operations) {
      const operation: Operation = {
        id: op.id,
        type: op.type as OperationType,
        documentId: op.documentId,
        documentType: document.type,
        userId: op.userId,
        timestamp: op.timestamp.getTime(),
        position: op.position || undefined,
        length: op.length || undefined,
        content: op.content,
        attributes: op.attributes || {},
        parentVersion: op.parentVersion,
      };

      this.applyOTOperation(tempDoc, operation);
    }

    return tempDoc.content;
  }

  // Delta compression for efficient updates
  public compressOperations(operations: Operation[]): Buffer {
    if (!this.compressionEnabled) {
      return Buffer.from(JSON.stringify(operations));
    }

    // Group consecutive operations
    const compressed: any[] = [];
    let current: any = null;

    for (const op of operations) {
      if (current && 
          current.type === op.type && 
          current.userId === op.userId &&
          Math.abs(current.timestamp - op.timestamp) < 1000) {
        // Merge operations
        if (op.type === OperationType.INSERT) {
          current.content += op.content;
          current.length = current.content.length;
        } else if (op.type === OperationType.DELETE) {
          current.length! += op.length!;
        }
      } else {
        if (current) compressed.push(current);
        current = { ...op };
      }
    }

    if (current) compressed.push(current);

    return Buffer.from(JSON.stringify(compressed));
  }

  // Calculate checksum
  private calculateChecksum(content: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(content));
    return hash.digest('hex');
  }

  // Check if user is in optimistic mode
  private isOptimisticMode(userId: string): boolean {
    const session = Array.from(this.sessions.values()).find(s => s.userId === userId);
    return session?.mode === SyncMode.OPTIMISTIC || false;
  }

  // Get initial content for document type
  private getInitialContent(type: DocumentType): any {
    switch (type) {
      case DocumentType.TEXT:
      case DocumentType.CODE:
        return '';
      case DocumentType.JSON:
      case DocumentType.WORKFLOW:
        return {};
      case DocumentType.BINARY:
        return Buffer.alloc(0);
      default:
        return null;
    }
  }

  // Start periodic sync for offline changes
  private startPeriodicSync(): void {
    setInterval(async () => {
      // Process pending operations
      for (const [userId, operations] of this.operationQueue) {
        for (const op of operations) {
          try {
            await this.applyOperation(op);
            
            // Remove from queue
            const index = operations.indexOf(op);
            if (index !== -1) {
              operations.splice(index, 1);
            }
          } catch (error) {
            console.error('Failed to sync operation:', error);
          }
        }
      }
    }, 5000); // Every 5 seconds
  }
}

// Conflict Resolution Strategies
abstract class ConflictResolutionStrategy {
  abstract resolve(op1: Operation, op2: Operation): Operation;
}

class LastWriteWinsStrategy extends ConflictResolutionStrategy {
  resolve(op1: Operation, op2: Operation): Operation {
    return op1.timestamp > op2.timestamp ? op1 : op2;
  }
}

class MergeStrategy extends ConflictResolutionStrategy {
  resolve(op1: Operation, op2: Operation): Operation {
    // Merge both operations
    if (op1.type === OperationType.UPDATE && op2.type === OperationType.UPDATE) {
      return {
        ...op1,
        content: { ...op2.content, ...op1.content },
      };
    }
    return op1;
  }
}

class ManualResolutionStrategy extends ConflictResolutionStrategy {
  resolve(op1: Operation, op2: Operation): Operation {
    // Queue for manual resolution
    return op1;
  }
}

// Export singleton instance
export const syncService = new SyncService();