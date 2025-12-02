import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, ArrowRight, Calendar, Clock } from "lucide-react";
import { MOCK_GOALS } from "@/lib/mockData";
import { useState } from "react";

export default function Goals() {
  const [goals, setGoals] = useState(MOCK_GOALS);

  const toggleStep = (goalId: string, stepId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const updatedSteps = goal.steps.map(step => 
        step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
      );
      
      const completedCount = updatedSteps.filter(s => s.isCompleted).length;
      const newProgress = Math.round((completedCount / updatedSteps.length) * 100);
      
      return {
        ...goal,
        steps: updatedSteps,
        progress: newProgress,
        status: newProgress === 100 ? "completed" : newProgress > 0 ? "in-progress" : "pending"
      };
    }));
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Career Goals</h2>
            <p className="text-muted-foreground">Track your progress towards your next career milestone.</p>
          </div>
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>

        <div className="grid gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="shadow-sm overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="bg-slate-50/50 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <Badge variant={goal.status === 'completed' ? 'default' : goal.status === 'in-progress' ? 'secondary' : 'outline'} className="capitalize">
                        {goal.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {goal.steps.length} Steps</span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{goal.progress}%</div>
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                </div>
                <Progress value={goal.progress} className="h-2 mt-4" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Action Plan</h4>
                  <div className="space-y-3">
                    {goal.steps.map((step) => (
                      <div 
                        key={step.id} 
                        className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer hover:bg-slate-50 ${step.isCompleted ? 'bg-slate-50 border-slate-200' : 'border-slate-200'}`}
                        onClick={() => toggleStep(goal.id, step.id)}
                      >
                        <div className={`mr-4 flex-shrink-0 ${step.isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {step.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                        </div>
                        <span className={`flex-1 text-sm ${step.isCompleted ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                          {step.title}
                        </span>
                        {step.isCompleted && <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-full">Done</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t flex justify-between py-3">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  Edit Goal Details
                </Button>
                <Button variant="ghost" size="sm" className="text-primary font-medium hover:bg-primary/10">
                  View Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
