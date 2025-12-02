import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ANALYSIS, MOCK_GOALS } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, TrendingUp, Activity, Award } from "lucide-react";

const data = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 68 },
  { name: 'Mar', score: 75 },
  { name: 'Apr', score: 72 },
  { name: 'May', score: 80 },
  { name: 'Jun', score: 85 },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your career trajectory overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Career Match Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_ANALYSIS.score}%</div>
              <p className="text-xs text-muted-foreground">
                +2.5% from last month
              </p>
              <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${MOCK_ANALYSIS.score}%` }}></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{MOCK_ANALYSIS.marketTrend}</div>
              <p className="text-xs text-muted-foreground">
                High demand in your target sector
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_GOALS.length}</div>
              <p className="text-xs text-muted-foreground">
                {MOCK_GOALS.filter(g => g.status === 'in-progress').length} in progress
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Salary Range</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(MOCK_ANALYSIS.salaryRange.min / 1000).toFixed(0)}k - ${(MOCK_ANALYSIS.salaryRange.max / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your location & exp.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Readiness Score Trend</CardTitle>
              <CardDescription>
                Your qualification score over the last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === data.length - 1 ? 'hsl(221 83% 53%)' : 'hsl(221 83% 80%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Top Skills Gap</CardTitle>
              <CardDescription>
                Priority areas to improve for target roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_ANALYSIS.skillsGap.map((skill, i) => (
                  <div key={skill} className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-destructive mr-3" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{skill}</p>
                      <p className="text-xs text-muted-foreground">Critical for Senior roles</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Add Goal
                    </Button>
                  </div>
                ))}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Your Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_ANALYSIS.strengths.map(strength => (
                      <span key={strength} className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
