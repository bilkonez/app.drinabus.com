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
  Calendar,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import VehicleManagement from "@/components/admin/VehicleManagement";
import EmployeeManagement from "@/components/admin/EmployeeManagement";
import RideManagement from "@/components/admin/RideManagement";
import MaintenanceManagement from "@/components/admin/MaintenanceManagement";
import RemindersTab from "@/components/admin/RemindersTab";
import ReportsTab from "@/components/admin/ReportsTab";
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
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Drina Bus Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Drina Bus</h1>
              <p className="text-sm text-muted-foreground">Upravljanje voznim parkom</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Odjava
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pregled
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Vozni park
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Uposlenici
            </TabsTrigger>
            <TabsTrigger value="rides" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Vožnje
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Održavanje
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reminderi
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Izvještaji
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Hero with Bus Images */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Dobrodošli nazad</h2>
                  <p className="text-primary-foreground/90">
                    Upravljajte vašim voznim parkom efikasno i profesionalno
                  </p>
                </div>
                {busImages.length > 0 && (
                  <div className="hidden md:flex gap-2">
                    {busImages.slice(0, 3).map((image, index) => (
                      <div key={index} className="w-24 h-16 rounded-lg overflow-hidden">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    Vozila ukupno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.vehicles_total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.vehicles_active} aktivno
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Završene vožnje danas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.rides_today}</div>
                  <p className="text-xs text-muted-foreground">završeno danas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Prihod mjesečno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.revenue_monthly.toFixed(2)} KM
                  </div>
                  <p className="text-xs text-muted-foreground">tekući mjesec</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vožnje mjesečno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.rides_monthly}</div>
                  <p className="text-xs text-muted-foreground">tekući mjesec</p>
                </CardContent>
              </Card>
            </div>

            {/* Reminders and Tomorrow's Rides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {reminders.map((reminder, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-foreground text-sm">{reminder.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Ističe: {new Date(reminder.expiry_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge variant={reminder.days_left <= 7 ? "destructive" : "secondary"} className="text-xs">
                            {reminder.days_left} dana
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
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {tomorrowRides.map((ride) => (
                        <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-foreground text-sm">{ride.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ride.start_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
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