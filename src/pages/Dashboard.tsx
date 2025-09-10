import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  Clock,
  Wrench,
  Plus,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import VehicleManagement from "@/components/admin/VehicleManagement";
import EmployeeManagement from "@/components/admin/EmployeeManagement";
import RideManagement from "@/components/admin/RideManagement";
import MaintenanceManagement from "@/components/admin/MaintenanceManagement";
import RemindersTab from "@/components/admin/RemindersTab";
import ReportsTab from "@/components/admin/ReportsTab";
import { AddCostModal } from "@/components/ui/AddCostModal";
import { formatDate, formatTime } from "@/lib/dateUtils";

const logoImage = "/lovable-uploads/6dd2d576-8aab-4bef-bf5a-0c7d8a00f49f.png";

interface Reminder {
  kind: string;
  expiry_date: string;
  days_left: number;
  type: 'vehicle' | 'employee';
  registration?: string;
  vehicle_id?: string;
  employee_name?: string;
  employee_id?: string;
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

interface CalendarEvent {
  ride_id: string;
  segment_id: string | null;
  title: string;
  event_start: string;
  event_end: string;
  event_date: string;
  start_hour: number;
  start_minute: number;
  ride_type: string;
  status: string;
}

interface DriversStats {
  drivers_today: number;
  top_driver_name: string | null;
  top_driver_hours: number;
}

interface FleetStats {
  active_vehicles_today: number;
  closest_deadline_vehicle: string | null;
  closest_deadline_date: string | null;
  closest_deadline_type: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [driversStats, setDriversStats] = useState<DriversStats>({
    drivers_today: 0,
    top_driver_name: null,
    top_driver_hours: 0,
  });
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    active_vehicles_today: 0,
    closest_deadline_vehicle: null,
    closest_deadline_date: null,
    closest_deadline_type: null,
  });
  const [loading, setLoading] = useState(true);
  const [addCostModalOpen, setAddCostModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time listeners for dashboard updates
    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rides' 
      }, () => {
        console.log('Rides changed, refreshing dashboard...');
        fetchTomorrowRides();
        fetchWeekEvents();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ride_segments' 
      }, () => {
        console.log('Ride segments changed, refreshing dashboard...');
        fetchWeekEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReminders(),
        fetchTomorrowRides(),
        fetchStats(),
        fetchBusImages(),
        fetchWeekEvents(),
        fetchDriversStats(),
        fetchFleetStats(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      // Fetch both vehicle and employee reminders
      const [vehicleResult, employeeResult] = await Promise.all([
        supabase
          .from('v_vehicle_reminders_dashboard')
          .select('*')
          .order('expiry_date', { ascending: true }),
        supabase
          .from('v_employee_reminders_dashboard')
          .select('*')
          .order('expiry_date', { ascending: true })
      ]);

      if (vehicleResult.error) throw vehicleResult.error;
      if (employeeResult.error) throw employeeResult.error;

      // Combine and sort all reminders by date, limit to 5
      const allReminders = [
        ...(vehicleResult.data || []).map(r => ({ ...r, type: 'vehicle' as const })),
        ...(employeeResult.data || []).map(r => ({ ...r, type: 'employee' as const }))
      ]
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
        .slice(0, 5);

      setReminders(allReminders);
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

  const fetchWeekEvents = async () => {
    try {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const { data, error } = await supabase
        .from('v_calendar_events')
        .select('*')
        .gte('event_date', monday.toISOString().split('T')[0])
        .lte('event_date', sunday.toISOString().split('T')[0])
        .order('event_start', { ascending: true });

      if (error) throw error;
      setWeekEvents(data || []);
    } catch (error) {
      console.error('Error fetching week events:', error);
    }
  };

  const fetchDriversStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get drivers working today
      const { data: todayDrivers, error: todayError } = await supabase
        .from('rides')
        .select('driver_id')
        .gte('start_at', today)
        .lt('start_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .not('driver_id', 'is', null);

      if (todayError) throw todayError;

      const uniqueDriversToday = new Set(todayDrivers?.map(r => r.driver_id) || []).size;

      // Get top driver this month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: topDriver, error: topDriverError } = await supabase
        .from('v_driver_monthly_hours')
        .select('driver_name, total_hours')
        .eq('month_start', `${currentMonth}-01`)
        .order('total_hours', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topDriverError) throw topDriverError;

      setDriversStats({
        drivers_today: uniqueDriversToday,
        top_driver_name: topDriver?.driver_name || null,
        top_driver_hours: topDriver?.total_hours || 0,
      });
    } catch (error) {
      console.error('Error fetching drivers stats:', error);
    }
  };

  const fetchFleetStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get active vehicles today
      const { data: todayVehicles, error: todayError } = await supabase
        .from('rides')
        .select('vehicle_id')
        .gte('start_at', today)
        .lt('start_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .not('vehicle_id', 'is', null);

      if (todayError) throw todayError;

      const uniqueVehiclesToday = new Set(todayVehicles?.map(r => r.vehicle_id) || []).size;

      // Get closest maintenance deadline
      const { data: vehicleDeadlines, error: deadlinesError } = await supabase
        .from('vehicle_deadlines')
        .select(`
          vehicle_id,
          registration_expiry,
          technical_expiry,
          technical_6m_expiry,
          tachograph_calibration_expiry,
          fire_extinguisher_expiry,
          vehicles (registration)
        `)
        .not('vehicles.registration', 'is', null);

      if (deadlinesError) throw deadlinesError;

      let closestDeadline = null;
      let closestDate = null;
      let closestType = null;
      let closestVehicle = null;

      vehicleDeadlines?.forEach(vd => {
        const deadlineTypes = [
          { date: vd.registration_expiry, type: 'Registracija' },
          { date: vd.technical_expiry, type: 'Tehnički pregled' },
          { date: vd.technical_6m_expiry, type: 'Tehnički 6m' },
          { date: vd.tachograph_calibration_expiry, type: 'Tahograf' },
          { date: vd.fire_extinguisher_expiry, type: 'PP aparat' },
        ];

        deadlineTypes.forEach(dt => {
          if (dt.date && (!closestDate || new Date(dt.date) < new Date(closestDate))) {
            closestDate = dt.date;
            closestType = dt.type;
            closestVehicle = (vd.vehicles as any)?.registration;
          }
        });
      });

      setFleetStats({
        active_vehicles_today: uniqueVehiclesToday,
        closest_deadline_vehicle: closestVehicle,
        closest_deadline_date: closestDate,
        closest_deadline_type: closestType,
      });
    } catch (error) {
      console.error('Error fetching fleet stats:', error);
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

  const handleCompleteReminder = async (reminder: any) => {
    try {
      let newExpiryDate: string;
      const currentDate = new Date(reminder.expiry_date);
      
      // Calculate new expiry date based on reminder type
      switch (reminder.reminder_type) {
        case 'Registracija':
          // Add 1 year
          newExpiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)).toISOString().split('T')[0];
          break;
        case 'Tehnički (godišnji)':
          // Add 1 year
          newExpiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)).toISOString().split('T')[0];
          break;
        case 'Tehnički (6m)':
          // Add 6 months
          newExpiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + 6)).toISOString().split('T')[0];
          break;
        case 'Baždarenje tahografa':
          // Add 2 years
          newExpiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 2)).toISOString().split('T')[0];
          break;
        case 'PP aparat':
          // Add 1 year
          newExpiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)).toISOString().split('T')[0];
          break;
        default:
          // Default to 1 year
          newExpiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)).toISOString().split('T')[0];
      }

      // Map reminder types to database column names
      const columnMap: { [key: string]: string } = {
        'Registracija': 'registration_expiry',
        'Tehnički (godišnji)': 'technical_expiry', 
        'Tehnički (6m)': 'technical_6m_expiry',
        'Baždarenje tahografa': 'tachograph_calibration_expiry',
        'PP aparat': 'fire_extinguisher_expiry'
      };

      const columnName = columnMap[reminder.reminder_type];
      if (!columnName) {
        throw new Error('Unknown reminder type');
      }

      // Update the deadline in database
      const { error } = await supabase
        .from('vehicle_deadlines')
        .update({ [columnName]: newExpiryDate })
        .eq('vehicle_id', reminder.vehicle_id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: `${reminder.reminder_type} za vozilo ${reminder.registration} je produžen`,
      });

      // Refresh data
      await fetchReminders();
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast({
        title: "Greška", 
        description: "Greška pri ažuriranju roka",
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/calendar')}
              className="text-xs"
            >
              <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Kalendar</span>
              <span className="sm:hidden">Cal</span>
            </Button>
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
            <TabsList className="grid w-full min-w-[700px] md:min-w-0 grid-cols-7 text-xs md:text-sm">
              <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Pregled</span>
                <span className="sm:hidden">Home</span>
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

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Left column - Widgets */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
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
                             <div key={index} className="flex items-center gap-3 p-2 md:p-3 border rounded-lg">
                               <Checkbox 
                                 onCheckedChange={(checked) => {
                                   if (checked) {
                                     handleCompleteReminder(reminder);
                                   }
                                 }}
                                 className="flex-shrink-0"
                               />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-xs md:text-sm truncate">{reminder.kind}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {reminder.type === 'vehicle' ? reminder.registration : reminder.employee_name} • {formatDate(reminder.expiry_date)}
                                  </p>
                                </div>
                                <Badge variant={reminder.days_left <= 7 ? "destructive" : "secondary"} className="text-xs flex-shrink-0">
                                  za {reminder.days_left} dana
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
                                  {new Date(ride.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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

                {/* Drivers Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Vozači
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Danas radi</span>
                        <span className="font-semibold">{driversStats.drivers_today} vozača</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Top vozač ovog mjeseca</div>
                        {driversStats.top_driver_name ? (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{driversStats.top_driver_name}</span>
                            <Badge variant="outline">{driversStats.top_driver_hours}h</Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nema podataka</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fleet Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-warning" />
                      Vozni park
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Aktivna vozila danas</span>
                        <span className="font-semibold">{fleetStats.active_vehicles_today} vozila</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Najbliži rok održavanja</div>
                        {fleetStats.closest_deadline_vehicle && fleetStats.closest_deadline_date ? (
                          <div className="space-y-1">
                            <div className="font-medium">{fleetStats.closest_deadline_vehicle}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{fleetStats.closest_deadline_type}</span>
                              <Badge variant="outline">
                                {new Date(fleetStats.closest_deadline_date).toLocaleDateString('en-GB')}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nema podataka</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column - Mini Calendar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      Mini kalendar
                    </CardTitle>
                    <CardDescription>
                      Vožnje u narednih 7 dana
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        const monday = new Date(date);
                        monday.setDate(date.getDate() - date.getDay() + 1);
                        const currentDate = new Date(monday);
                        currentDate.setDate(monday.getDate() + i);
                        
                        const dayEvents = weekEvents.filter(event => 
                          event.event_date === currentDate.toISOString().split('T')[0]
                        );

                        const isToday = currentDate.toDateString() === new Date().toDateString();

                        return (
                          <div key={i} className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isToday ? 'bg-primary/5 border-primary/20' : ''}`}
                               onClick={() => navigate(`/calendar?date=${currentDate.toISOString().split('T')[0]}`)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm">
                                {currentDate.toLocaleDateString('hr-HR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {dayEvents.length}
                              </Badge>
                            </div>
                            
                            {dayEvents.length > 0 ? (
                              <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground truncate" 
                                       title={`${event.title} - ${formatTime(event.event_start || '')}`}>
                                    <div className="flex items-center gap-1">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        event.status === 'zavrseno' ? 'bg-green-500' :
                                        event.status === 'u_toku' ? 'bg-blue-500' :
                                        event.status === 'otkazano' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`} />
                                      <span className="truncate">
                                        {formatTime(event.event_start || '')} {event.title}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{dayEvents.length - 3} više
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Nema vožnji</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
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

        <AddCostModal 
          open={addCostModalOpen}
          onOpenChange={setAddCostModalOpen}
          onSuccess={() => fetchDashboardData()}
        />
      </div>
    </div>
  );
};

export default Dashboard;