import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bus, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Fuel, 
  MapPin,
  Clock,
  CheckCircle,
  Wrench,
  Settings,
  FileText,
  BarChart3
} from "lucide-react";
import VehicleManagement from "@/components/fleet/VehicleManagement";
import DriverManagement from "@/components/fleet/DriverManagement";
import RouteManagement from "@/components/routes/RouteManagement";

interface DirectorDashboardProps {
  onLogout: () => void;
}

const DirectorDashboard = ({ onLogout }: DirectorDashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Mock data for dashboard
  const stats = {
    totalVehicles: 6,
    activeVehicles: 4,
    serviceVehicles: 1,
    unavailableVehicles: 1,
    todayTrips: 3,
    weeklyTrips: 12,
    totalEmployees: 8,
    activeEmployees: 7
  };

  const upcomingTrips = [
    {
      id: 1,
      title: "Goražde - Sarajevo",
      type: "Linijska",
      departure: "08:00",
      vehicle: "BA 123-AB",
      driver: "Marko Petrović",
      status: "confirmed"
    },
    {
      id: 2, 
      title: "Trebinje Izlet",
      type: "Turistička",
      departure: "09:30",
      vehicle: "BA 456-CD",
      driver: "Aleksandar Nikolić",
      status: "confirmed"
    },
    {
      id: 3,
      title: "Transfer - Sportski turnir",
      type: "Transfer",
      departure: "14:00", 
      vehicle: "BA 789-EF",
      driver: "Miloš Janković",
      status: "pending"
    }
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      message: "Vozilo BA 123-AB - registracija ističe za 15 dana",
      priority: "medium"
    },
    {
      id: 2,
      type: "info",
      message: "Marko Petrović - vozačka dozvola ističe za 30 dana",
      priority: "low"
    },
    {
      id: 3,
      type: "urgent",
      message: "Vozilo BA 999-XY na servisu - planirani povratak sutra",
      priority: "high"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <Clock className="w-4 h-4 text-warning" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-info" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Drina Bus - Admin Panel</h1>
              <p className="text-sm text-muted-foreground">
                Fleet & Operations Manager
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Odjava
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Vozni Park
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Uposlenici
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Vožnje
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Održavanje
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Izvještaji
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 shadow-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vozni Park
              </CardTitle>
              <Bus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeVehicles}/{stats.totalVehicles}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.serviceVehicles} na servisu
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Današnje Vožnje
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.todayTrips}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.weeklyTrips} ove sedmice
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Uposlenici
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeEmployees}/{stats.totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">
                aktivnih danas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profitabilnost
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                +15.2%
              </div>
              <p className="text-xs text-muted-foreground">
                u odnosu na prošli mjesec
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Trips */}
          <Card className="border-border/50 shadow-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Nadolazeće Vožnje
              </CardTitle>
              <CardDescription>
                Vožnje za danas i sutra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{trip.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {trip.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {trip.departure}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bus className="w-3 h-3" />
                        {trip.vehicle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {trip.driver}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(trip.status)}>
                    {trip.status === 'confirmed' ? 'Potvrđeno' : 'Na čekanju'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card className="border-border/50 shadow-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Obavještenja
              </CardTitle>
              <CardDescription>
                Važne napomene i podsjetnici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 text-xs ${
                        alert.priority === 'high' ? 'border-destructive text-destructive' :
                        alert.priority === 'medium' ? 'border-warning text-warning' :
                        'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {alert.priority === 'high' ? 'Hitno' : 
                       alert.priority === 'medium' ? 'Srednje' : 'Niska prioritet'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

            {/* Quick Actions */}
            <Card className="border-border/50 shadow-dark">
              <CardHeader>
                <CardTitle className="text-foreground">Brze Akcije</CardTitle>
                <CardDescription>
                  Najčešće korišćene funkcije
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="default" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("routes")}
                  >
                    <MapPin className="w-6 h-6" />
                    <span className="text-sm">Nova Vožnja</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("vehicles")}
                  >
                    <Bus className="w-6 h-6" />
                    <span className="text-sm">Vozni Park</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("employees")}
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Uposlenici</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("reports")}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-sm">Izvještaji</span>
                  </Button>
                </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Održavanje i Servisi</CardTitle>
                <CardDescription>
                  Upravljanje održavanjem vozila i troškovima
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Modul za održavanje će biti implementiran...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Izvještaji i Analitika</CardTitle>
                <CardDescription>
                  Finansijski i operativni izvještaji
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Modul za izvještaje će biti implementiran...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DirectorDashboard;