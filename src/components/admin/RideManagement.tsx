import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Route, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Ride {
  id: string;
  ride_type: string;
  origin: string;
  destination: string;
  start_at: string;
  end_at: string;
  vehicle_id: string | null;
  driver_id: string | null;
  total_price: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const RideManagement = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [formData, setFormData] = useState({
    ride_type: "linijski",
    origin: "",
    destination: "",
    start_at: "",
    end_at: "",
    vehicle_id: "",
    driver_id: "",
    total_price: "",
    notes: "",
    status: "planirano",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRides(),
        fetchVehicles(),
        fetchEmployees(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('start_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom učitavanja vožnji",
        variant: "destructive",
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, registration')
        .eq('status', 'dostupno')
        .order('registration');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('role', 'vozac')
        .eq('active', true)
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rideData = {
        ride_type: formData.ride_type,
        origin: formData.origin,
        destination: formData.destination,
        start_at: formData.start_at,
        end_at: formData.end_at,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        notes: formData.notes || null,
        status: formData.status,
      };

      if (editingRide) {
        const { error } = await supabase
          .from('rides')
          .update(rideData)
          .eq('id', editingRide.id);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Vožnja je uspješno ažurirana",
        });
      } else {
        const { error } = await supabase
          .from('rides')
          .insert(rideData);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Vožnja je uspješno dodana",
        });
      }

      setDialogOpen(false);
      resetForm();
      await fetchRides();
    } catch (error) {
      console.error('Error saving ride:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom čuvanja vožnje",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu vožnju?')) return;

    try {
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Vožnja je uspješno obrisana",
      });

      await fetchRides();
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom brisanja vožnje",
        variant: "destructive",
      });
    }
  };

  const openDialog = (ride?: Ride) => {
    if (ride) {
      setEditingRide(ride);
      setFormData({
        ride_type: ride.ride_type,
        origin: ride.origin,
        destination: ride.destination,
        start_at: ride.start_at,
        end_at: ride.end_at,
        vehicle_id: ride.vehicle_id || "",
        driver_id: ride.driver_id || "",
        total_price: ride.total_price?.toString() || "",
        notes: ride.notes || "",
        status: ride.status,
      });
    } else {
      setEditingRide(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ride_type: "linijski",
      origin: "",
      destination: "",
      start_at: "",
      end_at: "",
      vehicle_id: "",
      driver_id: "",
      total_price: "",
      notes: "",
      status: "planirano",
    });
    setEditingRide(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planirano: { variant: "outline" as const, label: "Planirano" },
      "u toku": { variant: "default" as const, label: "U toku" },
      zavrseno: { variant: "secondary" as const, label: "Završeno" },
      otkazano: { variant: "destructive" as const, label: "Otkazano" },
    };
    return variants[status as keyof typeof variants] || { variant: "outline" as const, label: status };
  };

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration})` : 'N/A';
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'N/A';
    const driver = employees.find(e => e.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vožnje</h2>
          <p className="text-muted-foreground">
            Upravljanje vožnjama i transportom
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj vožnju
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRide ? "Uredi vožnju" : "Dodaj novu vožnju"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ride_type">Tip prevoza</Label>
                <Select value={formData.ride_type} onValueChange={(value) => setFormData({...formData, ride_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linijski">Linijski prevoz</SelectItem>
                    <SelectItem value="vanlinijski">Vanlinijski prevoz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Polazište *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    required
                    placeholder="Sarajevo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Odredište *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    required
                    placeholder="Beograd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_at">Polazak *</Label>
                  <Input
                    id="start_at"
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData({...formData, start_at: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_at">Dolazak *</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vozilo</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite vozilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver_id">Vozač</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite vozača" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_price">Ukupna cijena (KM)</Label>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) => setFormData({...formData, total_price: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planirano">Planirano</SelectItem>
                    <SelectItem value="u toku">U toku</SelectItem>
                    <SelectItem value="zavrseno">Završeno</SelectItem>
                    <SelectItem value="otkazano">Otkazano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Dodatne napomene..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Čuvanje..." : "Sačuvaj"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Otkaži
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Lista vožnji
          </CardTitle>
          <CardDescription>
            {rides.length} vožnji u sistemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Učitavanje vožnji...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema vožnji u bazi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Relacija</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Polazak</TableHead>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Vozač</TableHead>
                    <TableHead>Cijena</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map((ride) => {
                    const statusInfo = getStatusBadge(ride.status);
                    return (
                      <TableRow key={ride.id}>
                        <TableCell className="font-medium">
                          {ride.origin} → {ride.destination}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ride.ride_type === 'linijski' ? 'Linijski' : 'Vanlinijski'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(ride.start_at).toLocaleDateString('bs-BA')}
                            <div className="text-muted-foreground">
                              {new Date(ride.start_at).toLocaleTimeString('bs-BA', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {getVehicleName(ride.vehicle_id)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getDriverName(ride.driver_id)}
                        </TableCell>
                        <TableCell>
                          {ride.total_price ? `${ride.total_price.toFixed(2)} KM` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(ride)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(ride.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Generiši PDF dokumente"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RideManagement;