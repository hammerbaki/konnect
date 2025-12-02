import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Briefcase, MapPin, DollarSign, Sparkles, GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";

import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { credits, deductCredit } = useTokens();
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (credits <= 0) {
      toast({
        variant: "destructive",
        title: "Insufficient Tokens",
        description: "You need at least 1 token to run a career analysis.",
      });
      return;
    }

    if (deductCredit()) {
      setIsAnalyzing(true);
      // Mock analysis delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 2000);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Career Analysis</h2>
          <p className="text-muted-foreground">Configure your parameters for a deep-dive career compatibility check.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="hard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                <TabsTrigger value="hard">Hard Conditions</TabsTrigger>
                <TabsTrigger value="soft">Soft Conditions</TabsTrigger>
                <TabsTrigger value="threshold">Thresholds</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="hard">
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Hard Constraints</CardTitle>
                      <CardDescription>Define your non-negotiable career requirements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="e.g. New York, Remote" defaultValue="San Francisco, CA" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Salary (Annual)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" className="pl-9" placeholder="100000" defaultValue="120000" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Excluded Industries</Label>
                        <Input placeholder="e.g. Tobacco, Gambling (comma separated)" />
                      </div>

                      <div className="space-y-2">
                        <Label>Target Roles</Label>
                        <Input placeholder="e.g. Product Manager, Data Scientist" defaultValue="Senior Product Manager" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="soft">
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Soft Preferences</CardTitle>
                      <CardDescription>Help the AI match your personality and interests.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Professional Interests</Label>
                        <Textarea placeholder="Describe what energizes you at work..." className="min-h-[100px]" defaultValue="I enjoy leading cross-functional teams and solving complex user problems using data-driven insights." />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Work Environment</Label>
                          <Select defaultValue="hybrid">
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="remote">Fully Remote</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="onsite">On-site</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Team Size Preference</Label>
                          <Select defaultValue="mid">
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="startup">Startup (1-50)</SelectItem>
                              <SelectItem value="mid">Growth (50-500)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (500+)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="threshold">
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-secondary" /> Threshold Analysis</CardTitle>
                      <CardDescription>Set baseline qualifications for feasibility checks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Education Level</Label>
                          <Select defaultValue="bachelors">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="highschool">High School</SelectItem>
                              <SelectItem value="bachelors">Bachelor's</SelectItem>
                              <SelectItem value="masters">Master's</SelectItem>
                              <SelectItem value="phd">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>GPA / Performance Score</Label>
                          <Input type="number" step="0.1" placeholder="4.0" defaultValue="3.8" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <div className="pt-4 px-2">
                          <Slider defaultValue={[5]} max={20} step={1} />
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>Entry</span>
                            <span>Mid (5y)</span>
                            <span>Senior (10y+)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end flex-col items-end gap-2">
              <Button 
                size="lg" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || showResults} 
                className="w-full md:w-auto bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" /> Run AI Analysis (1 Token)
                  </>
                )}
              </Button>
              {credits === 0 && (
                <p className="text-xs text-destructive">No tokens available. Please redeem a code.</p>
              )}
            </div>
          </div>

          {/* Results Panel - Sticky */}
          <div className="space-y-6">
             <Card className={`border-l-4 border-l-accent shadow-md transition-opacity duration-500 ${showResults ? 'opacity-100' : 'opacity-50 blur-[1px]'}`}>
              <CardHeader className="bg-slate-50/50">
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>Projected compatibility based on inputs.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {!showResults && !isAnalyzing && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Run analysis to see results</p>
                  </div>
                )}

                {(showResults || isAnalyzing) && (
                  <>
                    <div>
                      <div className="flex justify-between mb-2 text-sm font-medium">
                        <span>Overall Match</span>
                        <span className="text-primary font-bold">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border">
                        <span className="text-xs text-muted-foreground block">Salary Feasibility</span>
                        <span className="font-semibold text-emerald-600">High</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border">
                        <span className="text-xs text-muted-foreground block">Market Demand</span>
                        <span className="font-semibold text-primary">Growing</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-semibold">Key Insights</h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-fit">Positive</Badge>
                          <p className="text-xs">Strong alignment with leadership interests and soft skills.</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 h-fit">Gap</Badge>
                          <p className="text-xs">SQL proficiency is slightly below market trend for Senior roles.</p>
                        </div>
                      </div>
                    </div>

                    {showResults && (
                      <Button className="w-full" variant="outline">View Full Report</Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-primary mb-2">Pro Tip</h3>
                <p className="text-sm text-muted-foreground">
                  Adding more detailed "Soft Conditions" increases the accuracy of our cultural fit algorithm by up to 40%.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
