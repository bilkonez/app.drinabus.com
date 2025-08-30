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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Calendar, FileUp, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
}

interface VehicleDeadline {
  id: string;
  vehicle_id: string;
  registration_expiry: string | null;
  technical_expiry: string | null;
  technical_6m_expiry: string | null;
  tachograph_calibration_expiry: string | null;
  fire_extinguisher_expiry: string | null;
}

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  description: string | null;
  cost: number | null;
  invoice_url: string | null;
}

const MaintenanceManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deadlines, setDeadlines] = useState<VehicleDeadline[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState<Partial<VehicleDeadline>>({});
  const [serviceForm, setServiceForm] = useState<Partial<ServiceRecord>>({});

  useEffect(() => {
    fetchVehicles();
    fetchDeadlines();
    fetchServiceRecords();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, brand, model, registration')
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
    }
  };

  const fetchDeadlines = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_deadlines')
        .select('*');

      if (error) throw error;
      setDeadlines(data || []);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchServiceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_service')
        .select('*')
        .order('service_date', { ascending: false });

      if (error) throw error;
      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
    }
  };

  const handleSaveDeadlines = async () => {
    if (!selectedVehicle) {
      toast({
        title: "Greška",
        description: "Molimo odaberite vozilo",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingDeadline = deadlines.find(d => d.vehicle_id === selectedVehicle);
      
      if (existingDeadline) {
        const { error } = await supabase
          .from('vehicle_deadlines')
          .update({
            ...deadlineForm,
            vehicle_id: selectedVehicle,
          })
          .eq('id', existingDeadline.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_deadlines')
          .insert({
            ...deadlineForm,
            vehicle_id: selectedVehicle,
          });

        if (error) throw error;
      }

      toast({
        title: "Uspjeh",
        description: "Rokovi su uspješno sačuvani",
      });

      setDialogOpen(false);
      setDeadlineForm({});
      setSelectedVehicle("");
      fetchDeadlines();
    } catch (error) {
      console.error('Error saving deadlines:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom čuvanja rokova",
        variant: "destructive",
      });
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.vehicle_id || !serviceForm.service_date || !serviceForm.service_type) {
      toast({
        title: "Greška",
        description: "Molimo popunite sva obavezna polja",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicle_service')
        .insert(serviceForm);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Servis je uspješno dodat",
      });

      setServiceDialogOpen(false);
      setServiceForm({});
      fetchServiceRecords();
    } catch (error) {
      console.error('Error saving service record:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom čuvanja servisa",
        variant: "destructive",
      });
    }
  };

  const getDeadlineStatus = (date: string | null) => {
    if (!date) return null;
    
    const today = new Date();
    const deadlineDate = new Date(date);
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { variant: "destructive" as const, text: "Isteklo" };
    if (daysLeft <= 7) return { variant: "destructive" as const, text: `${daysLeft} dana` };
    if (daysLeft <= 30) return { variant: "warning" as const, text: `${daysLeft} dana` };
    return { variant: "secondary" as const, text: `${daysLeft} dana` };
  };

  const openDeadlineDialog = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    const existing = deadlines.find(d => d.vehicle_id === vehicleId);
    setDeadlineForm(existing || {});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Održavanje & rokovi</h2>
          <p className="text-muted-foreground">
            Upravljanje rokovima i servisima vozila
          </p>
        </div>
      </div>

      <Tabs defaultValue="deadlines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deadlines">Rokovi</TabsTrigger>
          <TabsTrigger value="service">Servisi</TabsTrigger>
        </TabsList>

        <TabsContent value="deadlines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rokovi vozila
              </CardTitle>
              <CardDescription>
                Pregled i upravljanje rokovima za sva vozila
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vozilo</TableHead>
                      <TableHead>Registracija</TableHead>
                      <TableHead>Tehnički (godišnji)</TableHead>
                      <TableHead>Tehnički (6m)</TableHead>
                      <TableHead>Tahograf</TableHead>
                      <TableHead>PP aparati</TableHead>
                      <TableHead>Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const deadline = deadlines.find(d => d.vehicle_id === vehicle.id);
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">
                            {vehicle.brand} {vehicle.model}
                          </TableCell>
                          <TableCell>{vehicle.registration}</TableCell>
                          <TableCell>
                            {deadline?.technical_expiry ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {new Date(deadline.technical_expiry).toLocaleDateString('bs-BA')}
                                </div>
                                {getDeadlineStatus(deadline.technical_expiry) && (
                                  <Badge variant={getDeadlineStatus(deadline.technical_expiry)!.variant}>
                                    {getDeadlineStatus(deadline.technical_expiry)!.text}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nije postavljen</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deadline?.technical_6m_expiry ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {new Date(deadline.technical_6m_expiry).toLocaleDateString('bs-BA')}
                                </div>
                                {getDeadlineStatus(deadline.technical_6m_expiry) && (
                                  <Badge variant={getDeadlineStatus(deadline.technical_6m_expiry)!.variant}>
                                    {getDeadlineStatus(deadline.technical_6m_expiry)!.text}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nije postavljen</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deadline?.tachograph_calibration_expiry ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {new Date(deadline.tachograph_calibration_expiry).toLocaleDateString('bs-BA')}
                                </div>
                                {getDeadlineStatus(deadline.tachograph_calibration_expiry) && (
                                  <Badge variant={getDeadlineStatus(deadline.tachograph_calibration_expiry)!.variant}>
                                    {getDeadlineStatus(deadline.tachograph_calibration_expiry)!.text}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nije postavljen</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deadline?.fire_extinguisher_expiry ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {new Date(deadline.fire_extinguisher_expiry).toLocaleDateString('bs-BA')}
                                </div>
                                {getDeadlineStatus(deadline.fire_extinguisher_expiry) && (
                                  <Badge variant={getDeadlineStatus(deadline.fire_extinguisher_expiry)!.variant}>
                                    {getDeadlineStatus(deadline.fire_extinguisher_expiry)!.text}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nije postavljen</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeadlineDialog(vehicle.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Uredi
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Servisi i radovi</h3>
              <p className="text-muted-foreground">Evidencija održavanja vozila</p>
            </div>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj servis
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Dodaj novi servis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vozilo</Label>
                    <Select 
                      value={serviceForm.vehicle_id || ""} 
                      onValueChange={(value) => setServiceForm({...serviceForm, vehicle_id: value})}
                    >
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
                    <Label>Tip servisa</Label>
                    <Select 
                      value={serviceForm.service_type || ""} 
                      onValueChange={(value) => setServiceForm({...serviceForm, service_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite tip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mali_servis">Mali servis</SelectItem>
                        <SelectItem value="veliki_servis">Veliki servis</SelectItem>
                        <SelectItem value="popravka">Popravka</SelectItem>
                        <SelectItem value="pregled">Pregled</SelectItem>
                        <SelectItem value="ostalo">Ostalo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Datum servisa</Label>
                    <Input
                      type="date"
                      value={serviceForm.service_date || ""}
                      onChange={(e) => setServiceForm({...serviceForm, service_date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cijena (KM)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={serviceForm.cost || ""}
                      onChange={(e) => setServiceForm({...serviceForm, cost: parseFloat(e.target.value) || undefined})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Opis radova</Label>
                    <Textarea
                      placeholder="Detaljan opis izvršenih radova..."
                      value={serviceForm.description || ""}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveService} className="flex-1">
                      Sačuvaj
                    </Button>
                    <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
                      Otkaži
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vozilo</TableHead>
                      <TableHead>Tip servisa</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Opis</TableHead>
                      <TableHead>Cijena</TableHead>
                      <TableHead>Račun</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceRecords.map((record) => {
                      const vehicle = vehicles.find(v => v.id === record.vehicle_id);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration})` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.service_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(record.service_date).toLocaleDateString('bs-BA')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.description || 'Bez opisa'}
                          </TableCell>
                          <TableCell>
                            {record.cost ? `${record.cost.toFixed(2)} KM` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {record.invoice_url ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={record.invoice_url} target="_blank" rel="noopener noreferrer">
                                  <FileUp className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nema</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deadline Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uredi rokove vozila</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Registracija - istek</Label>
              <Input
                type="date"
                value={deadlineForm.registration_expiry || ""}
                onChange={(e) => setDeadlineForm({...deadlineForm, registration_expiry: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Tehnički pregled (godišnji)</Label>
              <Input
                type="date"
                value={deadlineForm.technical_expiry || ""}
                onChange={(e) => setDeadlineForm({...deadlineForm, technical_expiry: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Tehnički pregled (6-mjesečni)</Label>
              <Input
                type="date"
                value={deadlineForm.technical_6m_expiry || ""}
                onChange={(e) => setDeadlineForm({...deadlineForm, technical_6m_expiry: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Baždarenje tahografa</Label>
              <Input
                type="date"
                value={deadlineForm.tachograph_calibration_expiry || ""}
                onChange={(e) => setDeadlineForm({...deadlineForm, tachograph_calibration_expiry: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>PP aparati</Label>
              <Input
                type="date"
                value={deadlineForm.fire_extinguisher_expiry || ""}
                onChange={(e) => setDeadlineForm({...deadlineForm, fire_extinguisher_expiry: e.target.value})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveDeadlines} className="flex-1">
                Sačuvaj
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Otkaži
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceManagement;