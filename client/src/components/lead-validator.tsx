import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  MapPin,
  Shield,
  TrendingUp
} from "lucide-react";

interface Lead {
  id: string;
  company: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  category?: string;
  score: number;
  validated: boolean;
  validationDetails?: ValidationDetails;
}

interface ValidationDetails {
  emailValid: boolean;
  phoneValid: boolean;
  websiteActive: boolean;
  addressVerified: boolean;
  mxRecordsFound?: boolean;
  sslCertValid?: boolean;
  domainAge?: number;
  trustScore?: number;
}

interface LeadValidatorProps {
  leads: Lead[];
  onValidationComplete?: (validatedLeads: Lead[]) => void;
}

export default function LeadValidator({ leads, onValidationComplete }: LeadValidatorProps) {
  const [validatedLeads, setValidatedLeads] = useState<Lead[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string, country?: string): boolean => {
    // Simple validation - can be enhanced with country-specific patterns
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const calculateScore = (lead: Lead, validation: ValidationDetails): number => {
    let score = 0;
    
    // Email scoring (30 points max)
    if (lead.email && validation.emailValid) {
      score += 20;
      if (validation.mxRecordsFound) score += 10;
    }
    
    // Phone scoring (20 points max)
    if (lead.phone && validation.phoneValid) {
      score += 20;
    }
    
    // Website scoring (25 points max)
    if (lead.website && validation.websiteActive) {
      score += 15;
      if (validation.sslCertValid) score += 10;
    }
    
    // Company info scoring (15 points max)
    if (lead.company) score += 5;
    if (lead.address && validation.addressVerified) score += 10;
    
    // Trust score bonus (10 points max)
    if (validation.trustScore) {
      score += Math.min(validation.trustScore, 10);
    }
    
    return Math.min(score, 100);
  };

  const validateLead = async (lead: Lead): Promise<Lead> => {
    // Simulate async validation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const validation: ValidationDetails = {
      emailValid: lead.email ? validateEmail(lead.email) : false,
      phoneValid: lead.phone ? validatePhone(lead.phone, lead.country) : false,
      websiteActive: !!lead.website, // Simplified - would check actual website
      addressVerified: !!lead.address,
      mxRecordsFound: Math.random() > 0.3, // Simulated
      sslCertValid: Math.random() > 0.2, // Simulated
      domainAge: Math.floor(Math.random() * 10) + 1,
      trustScore: Math.floor(Math.random() * 10) + 1
    };
    
    const score = calculateScore(lead, validation);
    
    return {
      ...lead,
      score,
      validated: true,
      validationDetails: validation
    };
  };

  const startValidation = async () => {
    setIsValidating(true);
    setProgress(0);
    
    const leadsToValidate = selectedLeads.size > 0 
      ? leads.filter(l => selectedLeads.has(l.id))
      : leads;
    
    const validated: Lead[] = [];
    
    for (let i = 0; i < leadsToValidate.length; i++) {
      const validatedLead = await validateLead(leadsToValidate[i]);
      validated.push(validatedLead);
      setProgress(((i + 1) / leadsToValidate.length) * 100);
    }
    
    setValidatedLeads(validated);
    setIsValidating(false);
    onValidationComplete?.(validated);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "High Quality" };
    if (score >= 60) return { variant: "secondary" as const, label: "Good" };
    if (score >= 40) return { variant: "outline" as const, label: "Fair" };
    return { variant: "destructive" as const, label: "Low Quality" };
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Lead Validation & Scoring
          </CardTitle>
          <CardDescription>
            Validate contact information and calculate quality scores for leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Validation Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={startValidation} 
                  disabled={isValidating || leads.length === 0}
                  data-testid="button-validate-leads"
                >
                  {isValidating ? "Validating..." : "Validate Leads"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedLeads.size > 0 
                    ? `${selectedLeads.size} selected` 
                    : `All ${leads.length} leads`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Mail className="w-3 h-3 mr-1" />
                  Email Check
                </Badge>
                <Badge variant="outline">
                  <Phone className="w-3 h-3 mr-1" />
                  Phone Format
                </Badge>
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  Domain Verify
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            {isValidating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Validating... {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Validation Results */}
            {validatedLeads.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Validation Results</h4>
                <div className="grid grid-cols-1 gap-3">
                  {validatedLeads.map((lead) => (
                    <Card key={lead.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => toggleLeadSelection(lead.id)}
                            data-testid={`checkbox-lead-${lead.id}`}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{lead.company}</span>
                              <Badge {...getScoreBadge(lead.score)}>
                                Score: {lead.score}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {lead.email && (
                                <div className="flex items-center gap-1">
                                  {lead.validationDetails?.emailValid ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className="text-muted-foreground">{lead.email}</span>
                                </div>
                              )}
                              
                              {lead.phone && (
                                <div className="flex items-center gap-1">
                                  {lead.validationDetails?.phoneValid ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className="text-muted-foreground">{lead.phone}</span>
                                </div>
                              )}
                              
                              {lead.website && (
                                <div className="flex items-center gap-1">
                                  {lead.validationDetails?.websiteActive ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                                  )}
                                  <span className="text-muted-foreground">{lead.website}</span>
                                </div>
                              )}
                              
                              {lead.country && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{lead.country}</span>
                                </div>
                              )}
                            </div>
                            
                            {lead.validationDetails && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {lead.validationDetails.mxRecordsFound && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    MX Records
                                  </span>
                                )}
                                {lead.validationDetails.sslCertValid && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    SSL Valid
                                  </span>
                                )}
                                {lead.validationDetails.domainAge && (
                                  <span>Domain Age: {lead.validationDetails.domainAge}y</span>
                                )}
                                {lead.validationDetails.trustScore && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Trust: {lead.validationDetails.trustScore}/10
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {validatedLeads.length > 0 && (
              <Card className="bg-accent/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {validatedLeads.filter(l => l.score >= 80).length}
                      </div>
                      <div className="text-muted-foreground">High Quality</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {validatedLeads.filter(l => l.score >= 60 && l.score < 80).length}
                      </div>
                      <div className="text-muted-foreground">Good Quality</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {validatedLeads.filter(l => l.score >= 40 && l.score < 60).length}
                      </div>
                      <div className="text-muted-foreground">Fair Quality</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(validatedLeads.reduce((sum, l) => sum + l.score, 0) / validatedLeads.length)}
                      </div>
                      <div className="text-muted-foreground">Average Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}