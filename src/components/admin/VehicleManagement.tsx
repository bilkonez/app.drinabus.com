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
import { Plus, Edit, Trash2, Bus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
  seats: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    registration: "",
    seats: "",
    status: "dostupno",
    notes: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom učitavanja vozila",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        registration: formData.registration,
        seats: formData.seats ? parseInt(formData.seats) : null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Vozilo je uspješno ažurirano",
        });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Vozilo je uspješno dodano",
        });
      }

      setDialogOpen(false);
      resetForm();
      await fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom čuvanja vozila",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovo vozilo?')) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Vozilo je uspješno obrisano",
      });

      await fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom brisanja vozila",
        variant: "destructive",
      });
    }
  };

  const openDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        registration: vehicle.registration,
        seats: vehicle.seats?.toString() || "",
        status: vehicle.status,
        notes: vehicle.notes || "",
      });
    } else {
      setEditingVehicle(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      registration: "",
      seats: "",
      status: "dostupno",
      notes: "",
    });
    setEditingVehicle(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      dostupno: { variant: "default" as const, label: "Dostupno" },
      "na servisu": { variant: "destructive" as const, label: "Na servisu" },
      "u voznji": { variant: "secondary" as const, label: "U vožnji" },
    };
    return variants[status as keyof typeof variants] || { variant: "default" as const, label: status };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vozni park</h2>
          <p className="text-muted-foreground">
            Upravljanje vozilima u floti
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj vozilo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Uredi vozilo" : "Dodaj novo vozilo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marka *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  required
                  placeholder="Mercedes, Volvo..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  required
                  placeholder="Travego, 9700..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Registracija *</Label>
                <Input
                  id="registration"
                  value={formData.registration}
                  onChange={(e) => setFormData({...formData, registration: e.target.value})}
                  required
                  placeholder="A01-B-123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Broj sjedala</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({...formData, seats: e.target.value})}
                  placeholder="50"
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dostupno">Dostupno</SelectItem>
                    <SelectItem value="na servisu">Na servisu</SelectItem>
                    <SelectItem value="u voznji">U vožnji</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Dodatne napomene o vozilu..."
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
            <Bus className="h-5 w-5" />
            Lista vozila
          </CardTitle>
          <CardDescription>
            {vehicles.length} vozila u floti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Učitavanje vozila...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema vozila u bazi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Registracija</TableHead>
                    <TableHead>Sjedala</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Napomene</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const statusInfo = getStatusBadge(vehicle.status);
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </TableCell>
                        <TableCell>{vehicle.registration}</TableCell>
                        <TableCell>{vehicle.seats || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {vehicle.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(vehicle)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(vehicle.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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

export default VehicleManagement;