'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Visit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { addDays, format, isSameDay, isSameWeek, startOfDay } from 'date-fns';
import { generateAdminInsights } from '@/ai/flows/admin-insights-generation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, TrendingUp, Briefcase } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

const colleges = ['All', 'CAS', 'COE', 'CBA', 'CCS', 'CIT', 'COED', 'CAH'];
const reasons = ['All', 'Research', 'Study', 'Borrowing'];

const AdminDashboard = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; trends: string[] } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const visitsCollection = collection(db, 'visits');
    const q = query(visitsCollection, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetchedVisits = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate(),
          } as Visit;
        });
        setVisits(fetchedVisits);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching visits:", error);
        toast({
          variant: "destructive",
          title: "Data Error",
          description: "Could not fetch visitor logs. The dashboard may not display correctly.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      const collegeMatch = collegeFilter === 'All' || visit.college === collegeFilter;
      const reasonMatch = reasonFilter === 'All' || visit.reason === reasonFilter;
      return collegeMatch && reasonMatch;
    });
  }, [visits, collegeFilter, reasonFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayVisitors = filteredVisits.filter(v => isSameDay(v.timestamp as Date, today)).length;
    const weeklyVisitors = filteredVisits.filter(v => isSameWeek(v.timestamp as Date, today, { weekStartsOn: 1 })).length;
    const totalEmployees = filteredVisits.filter(v => v.isEmployee).length;
    const totalStudents = filteredVisits.filter(v => !v.isEmployee).length;
    return { todayVisitors, weeklyVisitors, totalEmployees, totalStudents };
  }, [filteredVisits]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(addDays(new Date(), -6 + i)));
    return last7Days.map(day => {
      const dayStr = format(day, 'MMM d');
      const count = filteredVisits.filter(v => isSameDay(v.timestamp as Date, day)).length;
      return { name: dayStr, visits: count };
    });
  }, [filteredVisits]);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setInsights(null);
    try {
      if(filteredVisits.length === 0){
        toast({
          variant: "destructive",
          title: "No Data",
          description: "Cannot generate insights from an empty dataset. Please adjust your filters.",
        });
        return;
      }
      const result = await generateAdminInsights({
        visitorLogs: filteredVisits.map(v => ({
          timestamp: (v.timestamp as Date).toISOString(),
          reason: v.reason,
          college: v.college,
          visitorType: v.visitorType,
          isEmployee: v.isEmployee,
        })),
        filtersUsed: {
          college: collegeFilter !== 'All' ? collegeFilter : undefined,
          reason: reasonFilter !== 'All' ? reasonFilter : undefined,
        },
      });
      setInsights(result);
    } catch (error) {
      console.error('AI Insight Generation Failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Week's Visits</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Student vs Employee</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
            </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Visitor Analytics</CardTitle>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
             <p className="text-sm text-muted-foreground">Generate a summary and identify trends from the filtered data.</p>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[180px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Visits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyVisitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student vs Employee</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents} : {stats.totalEmployees}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor Analytics</CardTitle>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by College" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--secondary))' }}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
           <p className="text-sm text-muted-foreground">Generate a summary and identify trends from the filtered data.</p>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateInsights} disabled={isGenerating || loading}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Insights
          </Button>
          {isGenerating && <p className="mt-4 text-sm text-muted-foreground">AI is analyzing the data... this may take a moment.</p>}
          {insights && (
            <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
              <div>
                <h4 className="font-headline font-semibold">Summary</h4>
                <p className="text-sm text-muted-foreground">{insights.summary}</p>
              </div>
              <div>
                <h4 className="font-headline font-semibold">Key Trends</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {insights.trends.map((trend, i) => <li key={i}>{trend}</li>)}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
