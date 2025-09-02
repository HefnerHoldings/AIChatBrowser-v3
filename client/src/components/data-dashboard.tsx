import { useQuery } from "@tanstack/react-query";
import { ExtractedLead } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Filter } from "lucide-react";

interface DataDashboardProps {
  currentTaskId: string;
}

export default function DataDashboard({ currentTaskId }: DataDashboardProps) {
  const { data: extractedLeads = [] } = useQuery<ExtractedLead[]>({
    queryKey: ["/api/extracted-leads", { taskId: currentTaskId }],
    enabled: !!currentTaskId,
  });

  const stats = {
    total: extractedLeads.length,
    validated: extractedLeads.filter(lead => lead.validated).length,
    withEmail: extractedLeads.filter(lead => lead.email).length,
    withPhone: extractedLeads.filter(lead => lead.phone).length,
    avgScore: extractedLeads.length > 0 
      ? Math.round(extractedLeads.reduce((sum, lead) => sum + (lead.score || 0), 0) / extractedLeads.length)
      : 0,
  };

  const countryStats = extractedLeads.reduce((acc, lead) => {
    if (lead.country) {
      acc[lead.country] = (acc[lead.country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Data Dashboard</h2>
            <p className="text-muted-foreground">Extracted leads and analytics</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm" data-testid="button-export-csv">
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <Button size="sm" data-testid="button-export-xlsx">
              <Download className="w-4 h-4 mr-1" />
              Export XLSX
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{stats.validated}</div>
              <div className="text-sm text-muted-foreground">Validated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.withEmail}</div>
              <div className="text-sm text-muted-foreground">With Email</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.withPhone}</div>
              <div className="text-sm text-muted-foreground">With Phone</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.avgScore}</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Country Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(countryStats).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-3 bg-accent/30 rounded">
                  <span className="font-medium">{country}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(countryStats).length === 0 && (
                <div className="col-span-4 text-center text-muted-foreground py-4">
                  No country data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {extractedLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.company || "-"}</TableCell>
                        <TableCell>
                          {lead.website ? (
                            <a 
                              href={`https://${lead.website.replace(/^https?:\/\//, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {lead.website}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{lead.email || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{lead.phone || "-"}</TableCell>
                        <TableCell>{lead.country || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={lead.score && lead.score > 70 ? "default" : "secondary"}>
                            {lead.score || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.validated ? "default" : "secondary"}>
                            {lead.validated ? "Validated" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-lg font-medium mb-2">No data extracted yet</div>
                <div className="text-muted-foreground">
                  Start an automation task to see extracted leads here
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
