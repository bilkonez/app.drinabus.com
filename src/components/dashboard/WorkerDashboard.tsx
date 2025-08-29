import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Bus, 
  Calendar, 
  Clock, 
  MapPin, 
  Fuel, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  Phone,
  User
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WorkerDashboardProps {
  onLogout: () => void;
}

const WorkerDashboard = ({ onLogout }: WorkerDashboardProps) => {
  const [mileage, setMileage] = useState("");
  const [fuelAmount, setFuelAmount] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const { toast } = useToast();

  // Mock data for worker
  const workerInfo = {
    name: "Marko Petrović",
    role: "Vozač",
    phone: "+387 65 123 456",
    assignedVehicle: "BA 123-AB - Mercedes Sprinter"
  };

  const myTrips = [
    {
      id: 1,
      title: "Goražde - Sarajevo",
      type: "Linijska",
      departure: "08:00",
      arrival: "10:30",
      passengers: 18,
      status: "upcoming",
      route: "Goražde → Pale → Sarajevo"
    },
    {
      id: 2,
      title: "Sarajevo - Goražde",
      type: "Linijska", 
      departure: "15:00",
      arrival: "17:30",
      passengers: 15,
      status: "upcoming",
      route: "Sarajevo → Pale → Goražde"
    },
    {
      id: 3,
      title: "Trebinje Izlet",
      type: "Turistička",
      departure: "09:30",
      arrival: "18:00",
      passengers: 25,
      status: "tomorrow",
      route: "Goražde → Dubrovnik → Trebinje"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'completed': return 'secondary';
      case 'tomorrow': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Danas';
      case 'completed': return 'Završeno';
      case 'tomorrow': return 'Sutra';
      default: return status;
    }
  };

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mileage) {
      toast({
        title: "Kilometraža zabilježena",
        description: `Trenutno stanje: ${mileage} km`,
        variant: "default",
      });
      setMileage("");
    }
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fuelAmount && fuelPrice) {
      const total = (parseFloat(fuelAmount) * parseFloat(fuelPrice)).toFixed(2);
      toast({
        title: "Gorivo zabilježeno",
        description: `${fuelAmount}L x ${fuelPrice}KM = ${total}KM`,
        variant: "default",
      });
      setFuelAmount("");
      setFuelPrice("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moj Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Dobrodošli, {workerInfo.name}
            </p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Odjava
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Worker Info Card */}
        <Card className="border-border/50 shadow-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Moji Podaci
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Ime i prezime</Label>
              <p className="text-foreground font-medium">{workerInfo.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Uloga</Label>
              <Badge variant="outline">{workerInfo.role}</Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Kontakt</Label>
              <p className="text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {workerInfo.phone}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Dodijeljeno vozilo</Label>
              <p className="text-foreground flex items-center gap-2">
                <Bus className="w-4 h-4" />
                {workerInfo.assignedVehicle}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* My Trips */}
        <Card className="border-border/50 shadow-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Moje Vožnje
            </CardTitle>
            <CardDescription>
              Raspored vožnji za danas i sutra
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myTrips.map((trip) => (
              <div key={trip.id} className="p-4 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">{trip.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {trip.type}
                    </Badge>
                    <Badge variant={getStatusColor(trip.status)}>
                      {getStatusText(trip.status)}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {trip.passengers} putnika
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Polazak: {trip.departure}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Povratak: {trip.arrival}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.route}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Reports */}
          <Card className="border-border/50 shadow-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Brzi Unosi
              </CardTitle>
              <CardDescription>
                Zabilježite trenutno stanje i troškove
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mileage Form */}
              <form onSubmit={handleMileageSubmit} className="space-y-3">
                <Label htmlFor="mileage" className="text-foreground">Trenutna kilometraža</Label>
                <div className="flex gap-2">
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="npr. 125,430"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline">
                    Zabilježi
                  </Button>
                </div>
              </form>

              {/* Fuel Form */}
              <form onSubmit={handleFuelSubmit} className="space-y-3">
                <Label className="text-foreground">Točenje goriva</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Litara"
                    value={fuelAmount}
                    onChange={(e) => setFuelAmount(e.target.value)}
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="Cijena/L"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                    step="0.01"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Zabilježi Gorivo
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 shadow-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Brze Akcije
              </CardTitle>
              <CardDescription>
                Često korišćene funkcije
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start h-12">
                  <Camera className="w-5 h-5 mr-3" />
                  Fotografiši Kvar/Incident
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <AlertTriangle className="w-5 h-5 mr-3" />
                  Prijavi Problem
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Označi Vožnju Završenom
                </Button>
                <Button variant="outline" className="justify-start h-12">
                  <Phone className="w-5 h-5 mr-3" />
                  Kontaktiraj Dispečera
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Summary */}
        <Card className="border-border/50 shadow-dark">
          <CardHeader>
            <CardTitle className="text-foreground">Današnji Raspored</CardTitle>
            <CardDescription>
              Pregled aktivnosti za danas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-primary">2</div>
                <div className="text-sm text-muted-foreground">Planirane vožnje</div>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-success">33</div>
                <div className="text-sm text-muted-foreground">Ukupno putnika</div>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-info">5h 30min</div>
                <div className="text-sm text-muted-foreground">Vrijeme vožnje</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerDashboard;