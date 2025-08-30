import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
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
import VehicleManagement from "@/components/fleet/VehicleManagement";
import DriverManagement from "@/components/fleet/DriverManagement";
import RouteManagement from "@/components/routes/RouteManagement";
import MaintenanceManagement from "@/components/maintenance/MaintenanceManagement";
import RemindersTab from "@/components/reminders/RemindersTab";
import ReportsTab from "@/components/reports/ReportsTab";
import logoImage from "@/assets/logo.jpg";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [reminders, setReminders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Uspješna odjava",
        description: "Hvala vam što ste koristili naš sistem",
      });
      navigate("/login");
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
          <p className="text-muted-foreground">Učitavanje...</p>
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
              <h1 className="text-xl font-bold">Drina Bus</h1>
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
            <TabsTrigger value="routes" className="flex items-center gap-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vozila ukupno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">aktivno u floti</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vožnje danas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">zakazano/završeno</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Prihod mjesečno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">ukupno KM</p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Šta prvo ističe
                </CardTitle>
                <CardDescription>
                  Nadolazeći rokovi u narednih 30 dana
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.map((reminder, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Ističe: {new Date(reminder.expiry_date).toLocaleDateString('bs-BA')}
                          </p>
                        </div>
                        <Badge variant={reminder.days_left <= 7 ? "destructive" : "warning"}>
                          {reminder.days_left} dana
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nema nadolazećih rokova</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="employees">
            <DriverManagement />
          </TabsContent>

          <TabsContent value="routes">
            <RouteManagement />
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