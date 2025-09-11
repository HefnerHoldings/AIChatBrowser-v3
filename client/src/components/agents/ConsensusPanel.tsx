import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, AlertTriangle, Gavel } from 'lucide-react';
import type { Agent } from './AgentDashboard';

interface ConsensusRequest {
  id: string;
  action: string;
  proposer: string;
  description: string;
  context: any;
  votes: { [agentId: string]: boolean | null };
  requiredVotes: number;
  deadline: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  completedAt?: Date;
}

interface ConsensusPanelProps {
  requests: ConsensusRequest[];
  agents: Agent[];
}

const ConsensusPanel = ({ requests, agents }: ConsensusPanelProps) => {
  const [selectedRequest, setSelectedRequest] = useState<ConsensusRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Filter requests based on status
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'resolved') return req.status !== 'pending';
    return true;
  });

  const activeRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  // Calculate vote progress
  const getVoteProgress = (request: ConsensusRequest) => {
    const votes = Object.values(request.votes);
    const yesVotes = votes.filter(v => v === true).length;
    const noVotes = votes.filter(v => v === false).length;
    const totalVotes = yesVotes + noVotes;
    const progress = (yesVotes / request.requiredVotes) * 100;
    
    return { yesVotes, noVotes, totalVotes, progress };
  };

  // Get time remaining
  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  // Handle vote submission
  const handleVote = async (requestId: string, agentId: string, vote: boolean) => {
    try {
      const response = await fetch(`/api/agents/consensus/${requestId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, vote })
      });
      
      if (response.ok) {
        // Vote submitted successfully
        console.log('Vote submitted');
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Request List */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Consensus Requests</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Active: {activeRequests.length}
                </Badge>
                <Badge variant="outline" className="text-green-600">
                  Approved: {approvedRequests.length}
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  Rejected: {rejectedRequests.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all-consensus">All</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending-consensus">Pending</TabsTrigger>
                <TabsTrigger value="resolved" data-testid="tab-resolved-consensus">Resolved</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="space-y-3">
                  {filteredRequests.map(request => {
                    const voteStats = getVoteProgress(request);
                    return (
                      <Card
                        key={request.id}
                        className={`cursor-pointer transition-all ${
                          selectedRequest?.id === request.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedRequest(request)}
                        data-testid={`consensus-request-${request.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <span className="font-medium">{request.action}</span>
                            </div>
                            {request.status === 'pending' && (
                              <Badge variant="outline" className="text-xs">
                                {getTimeRemaining(request.deadline)}
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            {request.description}
                          </div>

                          <div className="flex items-center gap-2 text-xs mb-2">
                            <Badge variant="secondary" className="capitalize">
                              Proposed by: {request.proposer}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </span>
                          </div>

                          {request.status === 'pending' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Votes: {voteStats.yesVotes}/{request.requiredVotes}</span>
                                <span>{voteStats.progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={voteStats.progress} className="h-2" />
                              
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3 text-green-500" />
                                  <span className="text-xs">{voteStats.yesVotes}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsDown className="w-3 h-3 text-red-500" />
                                  <span className="text-xs">{voteStats.noVotes}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {request.status !== 'pending' && (
                            <Badge 
                              variant={request.status === 'approved' ? 'default' : 'destructive'}
                              className="mt-2"
                            >
                              {request.status}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Request Details */}
      {selectedRequest && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Consensus Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium mb-1">Action</div>
              <div className="text-sm text-muted-foreground">{selectedRequest.action}</div>
            </div>

            <div>
              <div className="font-medium mb-1">Description</div>
              <div className="text-sm text-muted-foreground">{selectedRequest.description}</div>
            </div>

            <div>
              <div className="font-medium mb-1">Context</div>
              <div className="text-xs p-2 bg-secondary rounded">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedRequest.context, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Voting Status</div>
              <div className="space-y-2">
                {agents.map(agent => {
                  const vote = selectedRequest.votes[agent.id];
                  return (
                    <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                          {agent.type}
                        </Badge>
                      </div>
                      
                      {selectedRequest.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          {vote === null ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2"
                                onClick={() => handleVote(selectedRequest.id, agent.id, true)}
                                data-testid={`button-vote-yes-${agent.id}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2"
                                onClick={() => handleVote(selectedRequest.id, agent.id, false)}
                                data-testid={`button-vote-no-${agent.id}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant={vote ? 'default' : 'destructive'}>
                              {vote ? 'Approved' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant={vote === true ? 'default' : vote === false ? 'destructive' : 'secondary'}>
                          {vote === true ? 'Yes' : vote === false ? 'No' : 'No Vote'}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Requires {selectedRequest.requiredVotes} votes to pass.
                  Deadline: {getTimeRemaining(selectedRequest.deadline)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsensusPanel;