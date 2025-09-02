import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, 
  Users, 
  Route, 
  Settings, 
  LogOut, 
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import VehicleManagement from "@/components/admin/VehicleManagement";
import EmployeeManagement from "@/components/admin/EmployeeManagement";
import RideManagement from "@/components/admin/RideManagement";
import MaintenanceManagement from "@/components/admin/MaintenanceManagement";
import RemindersTab from "@/components/admin/RemindersTab";
import ReportsTab from "@/components/admin/ReportsTab";
import CalendarPage from "@/pages/Calendar";
const logoImage = "/lovable-uploads/6dd2d576-8aab-4bef-bf5a-0c7d8a00f49f.png";

interface Reminder {
  kind: string;
  title: string;
  expiry_date: string;
  days_left: number;
}

interface TomorrowRide {
  id: string;
  label: string;
  start_date: string;
  start_time: string;
}

interface DashboardStats {
  vehicles_total: number;
  vehicles_active: number;
  rides_today: number;
  rides_monthly: number;
  revenue_monthly: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tomorrowRides, setTomorrowRides] = useState<TomorrowRide[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    vehicles_total: 0,
    vehicles_active: 0,
    rides_today: 0,
    rides_monthly: 0,
    revenue_monthly: 0,
  });
  const [busImages, setBusImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReminders(),
        fetchTomorrowRides(),
        fetchStats(),
        fetchBusImages(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('v_reminders_due')
        .select('*')
        .order('days_left', { ascending: true })
        .limit(5);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchTomorrowRides = async () => {
    try {
      const { data, error } = await supabase
        .from('v_tomorrow_rides')
        .select('*');

      if (error) throw error;
      setTomorrowRides(data || []);
    } catch (error) {
      console.error('Error fetching tomorrow rides:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch vehicle stats
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('status');

      if (vehiclesError) throw vehiclesError;

      // Fetch today's completed rides
      const today = new Date().toISOString().split('T')[0];
      const { data: ridesToday, error: ridesTodayError } = await supabase
        .from('rides')
        .select('id')
        .eq('status', 'zavrseno')
        .gte('start_at', today)
        .lt('start_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (ridesTodayError) throw ridesTodayError;

      // Fetch monthly stats
      const thisMonth = new Date().toISOString().substring(0, 7);
      const { data: monthlyStats, error: monthlyError } = await supabase
        .from('v_monthly_stats')
        .select('*')
        .eq('month', thisMonth)
        .single();

      if (monthlyError && monthlyError.code !== 'PGRST116') throw monthlyError;

      setStats({
        vehicles_total: vehicles?.length || 0,
        vehicles_active: vehicles?.filter(v => v.status === 'dostupno').length || 0,
        rides_today: ridesToday?.length || 0,
        rides_monthly: monthlyStats?.rides_count || 0,
        revenue_monthly: monthlyStats?.revenue_total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBusImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list('buses', { limit: 3 });

      if (error || !data || data.length === 0) {
        setBusImages([]);
        return;
      }

      const imageUrls = data.map(file => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(`buses/${file.name}`);
        return urlData.publicUrl;
      });

      setBusImages(imageUrls);
    } catch (error) {
      console.error('Error loading bus images:', error);
      setBusImages([]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Uspješna odjava",
        description: "Hvala vam što ste koristili naš sistem",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom odjave",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logoImage} alt="Drina Bus Logo" className="h-16 w-auto mx-auto" />
          <p className="text-muted-foreground">Učitavanje dashboard-a...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={logoImage} alt="Drina Bus Logo" className="h-8 md:h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-foreground">Drina Bus</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Upravljanje voznim parkom</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:inline text-xs md:text-sm text-muted-foreground truncate max-w-32">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Odjava</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full min-w-[800px] md:min-w-0 grid-cols-8 text-xs md:text-sm">
              <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Pregled</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Kalendar</span>
                <span className="sm:hidden">Cal</span>
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <Bus className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Vozni park</span>
                <span className="sm:hidden">Vozila</span>
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Uposlenici</span>
                <span className="sm:hidden">Tim</span>
              </TabsTrigger>
              <TabsTrigger value="rides" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <Route className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Vožnje</span>
                <span className="lg:hidden">Rute</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Održavanje</span>
                <span className="lg:hidden">Servis</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Reminderi</span>
                <span className="lg:hidden">Alert</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Izvještaji</span>
                <span className="lg:hidden">Rep.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Hero with Bus Images */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-3xl font-bold">Dobrodošli nazad</h2>
                  <p className="text-sm md:text-base text-primary-foreground/90">
                    Upravljajte vašim voznim parkom efikasno i profesionalno
                  </p>
                </div>
                {busImages.length > 0 && (
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    {busImages.slice(0, 3).map((image, index) => (
                      <div key={index} className="w-16 h-12 md:w-24 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={image} 
                          alt={`Bus ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-base flex items-center gap-1 md:gap-2">
                    <Bus className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Vozila ukupno</span>
                    <span className="sm:hidden">Vozila</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.vehicles_total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.vehicles_active} aktivno
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-base">
                    <span className="hidden sm:inline">Završene vožnje danas</span>
                    <span className="sm:hidden">Danas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.rides_today}</div>
                  <p className="text-xs text-muted-foreground">završeno</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-base">
                    <span className="hidden sm:inline">Prihod mjesečno</span>
                    <span className="sm:hidden">Prihod</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm md:text-2xl font-bold text-foreground">
                    {stats.revenue_monthly.toFixed(0)} KM
                  </div>
                  <p className="text-xs text-muted-foreground">mjesec</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-base">
                    <span className="hidden sm:inline">Vožnje mjesečno</span>
                    <span className="sm:hidden">Mjesec</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stats.rides_monthly}</div>
                  <p className="text-xs text-muted-foreground">vožnji</p>
                </CardContent>
              </Card>
            </div>

            {/* Reminders and Tomorrow's Rides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Reminders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Reminderi
                  </CardTitle>
                  <CardDescription>
                    Nadolazeći rokovi u narednih 30 dana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reminders.length > 0 ? (
                    <div className="space-y-2 md:space-y-3 max-h-64 overflow-y-auto">
                      {reminders.map((reminder, index) => (
                        <div key={index} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-xs md:text-sm truncate">{reminder.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reminder.expiry_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge variant={reminder.days_left <= 7 ? "destructive" : "secondary"} className="text-xs ml-2 flex-shrink-0">
                            {reminder.days_left}d
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nema nadolazećih rokova</p>
                  )}
                </CardContent>
              </Card>

              {/* Tomorrow's Rides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary" />
                    Vožnje sutra
                  </CardTitle>
                  <CardDescription>
                    Sve vožnje zakazane za sutra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tomorrowRides.length > 0 ? (
                    <div className="space-y-2 md:space-y-3 max-h-64 overflow-y-auto">
                      {tomorrowRides.map((ride) => (
                        <div key={ride.id} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-xs md:text-sm truncate">{ride.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ride.start_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {ride.start_time}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <span className="text-2xl mb-2 block">🚍</span>
                      <p className="text-sm">Nema vožnji za sutra</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarPage />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="rides">
            <RideManagement />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceManagement />
          </TabsContent>

          <TabsContent value="reminders">
            <RemindersTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;