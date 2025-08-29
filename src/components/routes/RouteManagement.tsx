import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, MapPin, Clock, Users, Bus, Calendar } from "lucide-react";

interface Route {
  id: string;
  name: string;
  type: 'linijska' | 'izlet' | 'turistička' | 'transfer';
  departure: string;
  destination: string;
  plannedDate: string;
  departureTime: string;
  returnTime?: string;
  vehicle: string;
  driver: string;
  capacity: number;
  occupiedSeats: number;
  pricePerPerson?: number;
  totalPrice?: number;
  status: 'planirano' | 'u_toku' | 'završeno' | 'otkazano';
  client?: string;
  notes: string;
}

const RouteManagement = () => {
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Goražde - Sarajevo linija',
      type: 'linijska',
      departure: 'Goražde',
      destination: 'Sarajevo',
      plannedDate: '2024-08-30',
      departureTime: '08:00',
      returnTime: '16:00',
      vehicle: 'K12-A-123',
      driver: 'Marko Petrović',
      capacity: 50,
      occupiedSeats: 32,
      pricePerPerson: 15,
      totalPrice: 480,
      status: 'planirano',
      notes: 'Redovna linija, svakog dana'
    },
    {
      id: '2',
      name: 'Trebinje - jednodnevni izlet',
      type: 'izlet',
      departure: 'Goražde',
      destination: 'Trebinje',
      plannedDate: '2024-09-01',
      departureTime: '07:00',
      returnTime: '20:00',
      vehicle: 'K12-B-456',
      driver: 'Aleksandar Nikolić',
      capacity: 19,
      occupiedSeats: 18,
      pricePerPerson: 45,
      totalPrice: 810,
      status: 'planirano',
      client: 'Turistička agencija Drina',
      notes: 'Obilazak Trebinja i Tvrdoša'
    },
    {
      id: '3',
      name: 'Transfer - Sportski turnir',
      type: 'transfer',
      departure: 'Goražde',
      destination: 'Pale',
      plannedDate: '2024-08-31',
      departureTime: '14:00',
      returnTime: '22:00',
      vehicle: 'K12-A-123',
      driver: 'Miloš Janković',
      capacity: 50,
      occupiedSeats: 25,
      totalPrice: 1200,
      status: 'planirano',
      client: 'FK Drina Goražde',
      notes: 'Prenos fudbalskog tima na utakmicu'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoute, setNewRoute] = useState<Partial<Route>>({
    name: '',
    type: 'linijska',
    departure: '',
    destination: '',
    plannedDate: '',
    departureTime: '',
    returnTime: '',
    vehicle: '',
    driver: '',
    capacity: 0,
    occupiedSeats: 0,
    pricePerPerson: 0,
    totalPrice: 0,
    status: 'planirano',
    client: '',
    notes: ''
  });

  const getStatusBadge = (status: Route['status']) => {
    const statusMap = {
      planirano: { label: 'Planirano', variant: 'default' as const },
      u_toku: { label: 'U toku', variant: 'secondary' as const },
      završeno: { label: 'Završeno', variant: 'outline' as const },
      otkazano: { label: 'Otkazano', variant: 'destructive' as const }
    };
    return statusMap[status];
  };

  const getTypeBadge = (type: Route['type']) => {
    const typeMap = {
      linijska: { label: 'Linijska', variant: 'default' as const },
      izlet: { label: 'Izlet', variant: 'secondary' as const },
      turistička: { label: 'Turistička', variant: 'outline' as const },
      transfer: { label: 'Transfer', variant: 'outline' as const }
    };
    return typeMap[type];
  };

  const handleAddRoute = () => {
    if (newRoute.name && newRoute.departure && newRoute.destination) {
      const route: Route = {
        id: Date.now().toString(),
        name: newRoute.name,
        type: newRoute.type || 'linijska',
        departure: newRoute.departure,
        destination: newRoute.destination,
        plannedDate: newRoute.plannedDate || '',
        departureTime: newRoute.departureTime || '',
        returnTime: newRoute.returnTime,
        vehicle: newRoute.vehicle || '',
        driver: newRoute.driver || '',
        capacity: newRoute.capacity || 0,
        occupiedSeats: newRoute.occupiedSeats || 0,
        pricePerPerson: newRoute.pricePerPerson,
        totalPrice: newRoute.totalPrice || 0,
        status: newRoute.status || 'planirano',
        client: newRoute.client,
        notes: newRoute.notes || ''
      };
      setRoutes([...routes, route]);
      setNewRoute({
        name: '',
        type: 'linijska',
        departure: '',
        destination: '',
        plannedDate: '',
        departureTime: '',
        returnTime: '',
        vehicle: '',
        driver: '',
        capacity: 0,
        occupiedSeats: 0,
        pricePerPerson: 0,
        totalPrice: 0,
        status: 'planirano',
        client: '',
        notes: ''
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Vožnje i Linije</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dodaj Vožnju
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Dodavanje Nove Vožnje</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Naziv vožnje</Label>
                <Input
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                  placeholder="Naziv vožnje ili linije"
                />
              </div>
              <div>
                <Label htmlFor="type">Tip</Label>
                <Select value={newRoute.type} onValueChange={(value: any) => setNewRoute({...newRoute, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tip vožnje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linijska">Linijska</SelectItem>
                    <SelectItem value="izlet">Izlet</SelectItem>
                    <SelectItem value="turistička">Turistička</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="departure">Polazište</Label>
                <Input
                  value={newRoute.departure}
                  onChange={(e) => setNewRoute({...newRoute, departure: e.target.value})}
                  placeholder="Polazište"
                />
              </div>
              <div>
                <Label htmlFor="destination">Odredište</Label>
                <Input
                  value={newRoute.destination}
                  onChange={(e) => setNewRoute({...newRoute, destination: e.target.value})}
                  placeholder="Odredište"
                />
              </div>
              <div>
                <Label htmlFor="plannedDate">Datum</Label>
                <Input
                  type="date"
                  value={newRoute.plannedDate}
                  onChange={(e) => setNewRoute({...newRoute, plannedDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="departureTime">Polazak</Label>
                <Input
                  type="time"
                  value={newRoute.departureTime}
                  onChange={(e) => setNewRoute({...newRoute, departureTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="returnTime">Povratak</Label>
                <Input
                  type="time"
                  value={newRoute.returnTime}
                  onChange={(e) => setNewRoute({...newRoute, returnTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vehicle">Vozilo</Label>
                <Select value={newRoute.vehicle} onValueChange={(value) => setNewRoute({...newRoute, vehicle: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite vozilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="K12-A-123">K12-A-123 - Neoplan Tourliner</SelectItem>
                    <SelectItem value="K12-B-456">K12-B-456 - Mercedes Sprinter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="driver">Vozač</Label>
                <Select value={newRoute.driver} onValueChange={(value) => setNewRoute({...newRoute, driver: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite vozača" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marko Petrović">Marko Petrović</SelectItem>
                    <SelectItem value="Aleksandar Nikolić">Aleksandar Nikolić</SelectItem>
                    <SelectItem value="Miloš Janković">Miloš Janković</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="capacity">Kapacitet</Label>
                <Input
                  type="number"
                  value={newRoute.capacity}
                  onChange={(e) => setNewRoute({...newRoute, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="pricePerPerson">Cijena po osobi (KM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRoute.pricePerPerson}
                  onChange={(e) => setNewRoute({...newRoute, pricePerPerson: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="totalPrice">Ukupna cijena (KM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRoute.totalPrice}
                  onChange={(e) => setNewRoute({...newRoute, totalPrice: parseFloat(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="client">Klijent/Firma</Label>
                <Input
                  value={newRoute.client}
                  onChange={(e) => setNewRoute({...newRoute, client: e.target.value})}
                  placeholder="Naziv klijenta ili firme"
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  value={newRoute.notes}
                  onChange={(e) => setNewRoute({...newRoute, notes: e.target.value})}
                  placeholder="Dodatne informacije o vožnji..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Otkaži
              </Button>
              <Button onClick={handleAddRoute}>
                Dodaj Vožnju
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pregled Vožnji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vožnja</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Datum/Vrijeme</TableHead>
                <TableHead>Vozilo/Vozač</TableHead>
                <TableHead>Popunjenost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <Badge variant={getTypeBadge(route.type).variant} className="text-xs">
                        {getTypeBadge(route.type).label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      {route.departure} → {route.destination}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(route.plannedDate).toLocaleDateString('bs-BA')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.departureTime} {route.returnTime && `- ${route.returnTime}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Bus className="w-3 h-3" />
                        {route.vehicle}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {route.driver}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {route.occupiedSeats}/{route.capacity}
                      <div className="text-xs text-muted-foreground">
                        {Math.round((route.occupiedSeats / route.capacity) * 100)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(route.status).variant}>
                      {getStatusBadge(route.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteManagement;