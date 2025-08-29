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
import { Plus, Edit, Trash2, Bus, Fuel, Wrench, Calendar } from "lucide-react";

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  registration: string;
  seats: number;
  fuelConsumption: number;
  vin: string;
  mileage: number;
  status: 'dostupno' | 'na_servisu' | 'na_vožnji';
  insurance: string;
  technicalInspection: string;
  notes: string;
}

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      type: 'autobus',
      brand: 'Neoplan',
      model: 'Tourliner',
      year: 2018,
      registration: 'K12-A-123',
      seats: 50,
      fuelConsumption: 28,
      vin: 'WDB9635131L123456',
      mileage: 145000,
      status: 'dostupno',
      insurance: '2024-12-15',
      technicalInspection: '2024-10-30',
      notes: 'Turistička klasa, klima, WC'
    },
    {
      id: '2',
      type: 'minibus',
      brand: 'Mercedes',
      model: 'Sprinter',
      year: 2020,
      registration: 'K12-B-456',
      seats: 19,
      fuelConsumption: 12,
      vin: 'WDB9061451X123789',
      mileage: 89000,
      status: 'na_servisu',
      insurance: '2024-11-20',
      technicalInspection: '2024-09-15',
      notes: 'Redovni servis'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    type: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    registration: '',
    seats: 0,
    fuelConsumption: 0,
    vin: '',
    mileage: 0,
    status: 'dostupno',
    insurance: '',
    technicalInspection: '',
    notes: ''
  });

  const getStatusBadge = (status: Vehicle['status']) => {
    const statusMap = {
      dostupno: { label: 'Dostupno', variant: 'default' as const },
      na_servisu: { label: 'Na servisu', variant: 'destructive' as const },
      na_vožnji: { label: 'Na vožnji', variant: 'secondary' as const }
    };
    return statusMap[status];
  };

  const handleAddVehicle = () => {
    if (newVehicle.brand && newVehicle.model && newVehicle.registration) {
      const vehicle: Vehicle = {
        id: Date.now().toString(),
        type: newVehicle.type || '',
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year || new Date().getFullYear(),
        registration: newVehicle.registration,
        seats: newVehicle.seats || 0,
        fuelConsumption: newVehicle.fuelConsumption || 0,
        vin: newVehicle.vin || '',
        mileage: newVehicle.mileage || 0,
        status: newVehicle.status || 'dostupno',
        insurance: newVehicle.insurance || '',
        technicalInspection: newVehicle.technicalInspection || '',
        notes: newVehicle.notes || ''
      };
      setVehicles([...vehicles, vehicle]);
      setNewVehicle({
        type: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        registration: '',
        seats: 0,
        fuelConsumption: 0,
        vin: '',
        mileage: 0,
        status: 'dostupno',
        insurance: '',
        technicalInspection: '',
        notes: ''
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Vozni Park</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dodaj Vozilo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dodavanje Novog Vozila</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tip vozila</Label>
                <Select value={newVehicle.type} onValueChange={(value) => setNewVehicle({...newVehicle, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autobus">Autobus</SelectItem>
                    <SelectItem value="minibus">Minibus</SelectItem>
                    <SelectItem value="kombi">Kombi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Marka</Label>
                <Input
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                  placeholder="Mercedes, Neoplan..."
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  placeholder="Sprinter, Tourliner..."
                />
              </div>
              <div>
                <Label htmlFor="year">Godina</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="registration">Registracija</Label>
                <Input
                  value={newVehicle.registration}
                  onChange={(e) => setNewVehicle({...newVehicle, registration: e.target.value})}
                  placeholder="K12-A-123"
                />
              </div>
              <div>
                <Label htmlFor="seats">Broj sjedala</Label>
                <Input
                  type="number"
                  value={newVehicle.seats}
                  onChange={(e) => setNewVehicle({...newVehicle, seats: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="fuelConsumption">Potrošnja (l/100km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newVehicle.fuelConsumption}
                  onChange={(e) => setNewVehicle({...newVehicle, fuelConsumption: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="vin">VIN broj</Label>
                <Input
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  value={newVehicle.notes}
                  onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                  placeholder="Dodatne informacije o vozilu..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Otkaži
              </Button>
              <Button onClick={handleAddVehicle}>
                Dodaj Vozilo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Pregled Vozila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vozilo</TableHead>
                <TableHead>Registracija</TableHead>
                <TableHead>Sjedala</TableHead>
                <TableHead>Kilometraža</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tehnički</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                      <div className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.type}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{vehicle.registration}</TableCell>
                  <TableCell>{vehicle.seats}</TableCell>
                  <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(vehicle.status).variant}>
                      {getStatusBadge(vehicle.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(vehicle.technicalInspection).toLocaleDateString('bs-BA')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
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

export default VehicleManagement;