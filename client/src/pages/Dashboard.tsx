import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { useStats } from "@/hooks/use-stats";
import { Users, HandCoins, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback for null data during initial load/error
  const data = stats || {
    memberCount: 0,
    attendanceTrend: 0,
    donationsThisMonth: 0,
    upcomingEvents: 0,
    newConverts: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Dashboard" 
        description="Overview of church activities and metrics"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={data.memberCount}
          description="Active members"
          icon={Users}
        />
        <StatsCard
          title="Donations (Month)"
          value={`$${(data.donationsThisMonth / 100).toLocaleString()}`}
          description="Tithes & Offerings"
          icon={HandCoins}
        />
        <StatsCard
          title="Attendance Trend"
          value={`${data.attendanceTrend}%`}
          trend={data.attendanceTrend}
          description="Vs. last month"
          icon={TrendingUp}
        />
        <StatsCard
          title="Upcoming Events"
          value={data.upcomingEvents}
          description="Next 7 days"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-md m-6 border border-dashed">
            Chart integration requires 'recharts' package (installed) - implementing placeholder.
            {/* 
               In a real implementation with recharts:
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}> ... </AreaChart>
               </ResponsiveContainer>
            */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <a href="/members" className="flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">Add New Member</div>
                  <div className="text-xs text-muted-foreground">Register a new profile</div>
                </div>
              </a>
              
              <a href="/donations" className="flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="h-8 w-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                  <HandCoins className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">Record Donation</div>
                  <div className="text-xs text-muted-foreground">Log tithe or offering</div>
                </div>
              </a>

              <a href="/events" className="flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="h-8 w-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">Schedule Event</div>
                  <div className="text-xs text-muted-foreground">Create new activity</div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
