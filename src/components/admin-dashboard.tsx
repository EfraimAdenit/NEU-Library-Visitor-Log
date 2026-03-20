'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Visit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { addDays, format, isSameDay, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { generateAdminInsights } from '@/ai/flows/admin-insights-generation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, TrendingUp, Briefcase, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';


const colleges = ['All', 'CAS', 'COE', 'CBA', 'CCS', 'CIT', 'COED', 'CAH'];
const reasons = ['All', 'Research', 'Study', 'Borrowing'];
const visitorTypes = ['All', 'Student', 'Employee'];


const AdminDashboard = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('All');
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(addDays(new Date(), -6)),
    to: endOfDay(new Date()),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; trends: string[] } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const visitsCollection = collection(db, 'visits');
    
    const queryConstraints = [];
    
    if (date?.from) {
      queryConstraints.push(where('timestamp', '>=', Timestamp.fromDate(date.from)));
    }
    if (date?.to) {
      queryConstraints.push(where('timestamp', '<=', Timestamp.fromDate(date.to)));
    }
    if (collegeFilter !== 'All') {
      queryConstraints.push(where('college', '==', collegeFilter));
    }
    if (reasonFilter !== 'All') {
      queryConstraints.push(where('reason', '==', reasonFilter));
    }
     if (visitorTypeFilter !== 'All') {
      queryConstraints.push(where('visitorType', '==', visitorTypeFilter));
    }

    const q = query(visitsCollection, ...queryConstraints, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        // Wait for live server response before rendering to avoid flashes of old data.
        if (snapshot.metadata.fromCache) {
          return;
        }

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
  }, [toast, date, collegeFilter, reasonFilter, visitorTypeFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayVisitors = visits.filter(v => isSameDay(v.timestamp as Date, today)).length;
    
    const weekStart = date?.from || startOfDay(addDays(new Date(), -6));
    const weekEnd = date?.to || endOfDay(new Date());
    const weeklyVisitors = visits.filter(v => isWithinInterval(v.timestamp as Date, {start: weekStart, end: weekEnd})).length;

    const totalEmployees = visits.filter(v => v.isEmployee).length;
    const totalStudents = visits.filter(v => !v.isEmployee).length;
    
    return { todayVisitors, weeklyVisitors, totalEmployees, totalStudents };
  }, [visits, date]);

  const chartData = useMemo(() => {
    const start = date?.from || startOfDay(addDays(new Date(), -6));
    const end = date?.to || endOfDay(new Date());
    const dayCount = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    const days = Array.from({ length: Math.ceil(dayCount) + 1 }, (_, i) => startOfDay(addDays(start, i)));

    return days.map(day => {
      const dayStr = format(day, 'MMM d');
      const count = visits.filter(v => isSameDay(v.timestamp as Date, day)).length;
      return { name: dayStr, visits: count };
    });
  }, [visits, date]);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setInsights(null);
    try {
      if(visits.length === 0){
        toast({
          variant: "destructive",
          title: "No Data",
          description: "Cannot generate insights from an empty dataset. Please adjust your filters.",
        });
        return;
      }
      const result = await generateAdminInsights({
        visitorLogs: visits.map(v => ({
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

  const setDatePreset = (preset: 'today' | '7d' | '30d') => {
    const to = endOfDay(new Date());
    if (preset === 'today') {
      setDate({ from: startOfDay(new Date()), to });
    } else if (preset === '7d') {
      setDate({ from: startOfDay(addDays(new Date(), -6)), to });
    } else if (preset === '30d') {
       setDate({ from: startOfDay(addDays(new Date(), -29)), to });
    }
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
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.todayVisitors}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits in Range</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.weeklyVisitors}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student vs Employee</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalStudents} : {stats.totalEmployees}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor Analytics</CardTitle>
          <div className="flex flex-wrap items-center gap-4 pt-4">
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[260px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDatePreset('today')}>Today</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDatePreset('7d')}>Last 7 days</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDatePreset('30d')}>Last 30 days</Button>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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
             <Select value={visitorTypeFilter} onValueChange={setVisitorTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                {visitorTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
          {loading ? (
             <Skeleton className="h-[350px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
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
