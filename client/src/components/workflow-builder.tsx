import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Save, Trash2 } from "lucide-react";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

export default function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: "step-1",
      type: "search",
      name: "Search Google",
      config: { query: "cookware wholesaler EU", pages: 5 }
    },
    {
      id: "step-2", 
      type: "extract",
      name: "Extract Contact Info",
      config: { fields: ["company", "email", "phone", "website"] }
    }
  ]);

  const stepTypes = [
    { type: "search", name: "Search", icon: "🔍" },
    { type: "navigate", name: "Navigate", icon: "🧭" },
    { type: "extract", name: "Extract Data", icon: "📊" },
    { type: "validate", name: "Validate", icon: "✅" },
    { type: "export", name: "Export", icon: "📁" },
  ];

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: `New ${type} step`,
      config: {}
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Workflow Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold"
              data-testid="input-workflow-name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-save-workflow">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button size="sm" data-testid="button-test-workflow">
              <Play className="w-4 h-4 mr-1" />
              Test Run
            </Button>
          </div>
        </div>

        {/* Step Types Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {stepTypes.map((stepType) => (
                <Button
                  key={stepType.type}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => addStep(stepType.type)}
                  data-testid={`button-add-${stepType.type}`}
                >
                  <div className="text-2xl mb-1">{stepType.icon}</div>
                  <div className="text-xs">{stepType.name}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Workflow Steps</h3>
          
          {steps.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="text-lg font-medium mb-1">No steps added yet</div>
                  <div className="text-sm">Add steps from the palette above to build your workflow</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <Card key={step.id} className="workflow-node">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {step.type.charAt(0).toUpperCase() + step.type.slice(1)} step
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{step.type}</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          data-testid={`button-remove-${step.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Step Configuration */}
                    <div className="mt-3 p-3 bg-accent/30 rounded">
                      <div className="text-xs font-medium mb-2">Configuration:</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {Object.keys(step.config).length > 0 
                          ? JSON.stringify(step.config, null, 2)
                          : "No configuration set"
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Workflow Settings</div>
                <div className="text-sm text-muted-foreground">
                  {steps.length} step{steps.length !== 1 ? 's' : ''} configured
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export YAML
                </Button>
                <Button variant="outline" size="sm">
                  Import YAML
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
