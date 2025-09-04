import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car, FileText, Plus, Upload, Wrench, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/dateUtils";
import { AddCostModal } from "@/components/ui/AddCostModal";

const MaintenanceManagement = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedRide, setSelectedRide] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [addCostModalOpen, setAddCostModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, deadlinesRes, servicesRes, costsRes, ridesRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('registration'),
        supabase.from('vehicle_deadlines').select(`
          *, 
          vehicle:vehicles(registration, brand, model)
        `),
        supabase.from('vehicle_service').select(`
          *, 
          vehicle:vehicles(registration, brand, model)
        `).order('service_date', { ascending: false }),
        supabase.from('costs').select(`
          *, 
          vehicle:vehicles(registration),
          ride:rides(origin, destination)
        `).order('created_at', { ascending: false }),
        supabase.from('rides').select('id, origin, destination, start_at').order('start_at', { ascending: false }).limit(50)
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (deadlinesRes.error) throw deadlinesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (costsRes.error) throw costsRes.error;
      if (ridesRes.error) throw ridesRes.error;

      setVehicles(vehiclesRes.data || []);
      setDeadlines(deadlinesRes.data || []);
      setServices(servicesRes.data || []);
      setCosts(costsRes.data || []);
      setRides(ridesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Greška",
        description: "Greška pri učitavanju podataka",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadInvoice = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Greška",
        description: "Greška pri upload-u fajla",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveDeadlines = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const vehicleId = editingDeadline?.vehicle_id || selectedVehicle;
    
    if (!vehicleId) return;

    const deadlineData = {
      vehicle_id: vehicleId,
      registration_expiry: formData.get('registration_expiry') as string || null,
      technical_expiry: formData.get('technical_expiry') as string || null,
      technical_6m_expiry: formData.get('technical_6m_expiry') as string || null,
      tachograph_calibration_expiry: formData.get('tachograph_calibration_expiry') as string || null,
      fire_extinguisher_expiry: formData.get('fire_extinguisher_expiry') as string || null,
    };

    try {
      const { error } = await supabase
        .from('vehicle_deadlines')
        .upsert(deadlineData, { onConflict: 'vehicle_id' });

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Rokovi su uspješno sačuvani",
      });

      fetchData();
      setSelectedVehicle("");
      setEditingDeadline(null);
    } catch (error) {
      console.error('Error saving deadlines:', error);
      toast({
        title: "Greška",
        description: "Greška pri čuvanju rokova",
        variant: "destructive",
      });
    }
  };

  const handleSaveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fileInput = event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const vehicleId = editingService?.vehicle_id || selectedVehicle;
    
    if (!vehicleId) return;
    
    let invoiceUrl = editingService?.invoice_url || null;
    if (fileInput?.files?.[0]) {
      invoiceUrl = await uploadInvoice(fileInput.files[0]);
      if (!invoiceUrl) return;
    }

    const serviceData = {
      vehicle_id: vehicleId,
      service_type: formData.get('service_type') as string,
      description: formData.get('description') as string,
      service_date: formData.get('service_date') as string,
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null,
      invoice_url: invoiceUrl,
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from('vehicle_service')
          .update(serviceData)
          .eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_service')
          .insert(serviceData);
        if (error) throw error;
      }

      toast({
        title: "Uspjeh",
        description: editingService ? "Servis je uspješno ažuriran" : "Servis je uspješno dodan",
      });

      fetchData();
      setSelectedVehicle("");
      setEditingService(null);
      event.currentTarget.reset();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Greška",
        description: "Greška pri čuvanju servisa",
        variant: "destructive",
      });
    }
  };

  const handleSaveCost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const costData = {
      cost_type: formData.get('cost_type') as string,
      amount: parseFloat(formData.get('amount') as string),
      note: formData.get('note') as string,
      vehicle_id: selectedVehicle || null,
      ride_id: selectedRide || null,
    };

    try {
      if (editingCost) {
        const { error } = await supabase
          .from('costs')
          .update(costData)
          .eq('id', editingCost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('costs')
          .insert(costData);
        if (error) throw error;
      }

      toast({
        title: "Uspjeh",
        description: editingCost ? "Trošak je uspješno ažuriran" : "Trošak je uspješno dodan",
      });

      fetchData();
      setSelectedVehicle("");
      setSelectedRide("");
      setEditingCost(null);
      event.currentTarget.reset();
    } catch (error) {
      console.error('Error saving cost:', error);
      toast({
        title: "Greška",
        description: "Greška pri čuvanju troška",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDeadline = async (deadlineId: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_deadlines')
        .delete()
        .eq('id', deadlineId);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Rokovi su uspješno obrisani",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting deadline:', error);
      toast({
        title: "Greška",
        description: "Greška pri brisanju rokova",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_service')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Servis je uspješno obrisan",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Greška",
        description: "Greška pri brisanju servisa",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', costId);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Trošak je uspješno obrisan",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast({
        title: "Greška",
        description: "Greška pri brisanju troška",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Održavanje vozila</h2>
          <p className="text-muted-foreground">
            Upravljanje rokovima, servisima i troškovima
          </p>
        </div>
      </div>

      <Tabs defaultValue="deadlines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deadlines">Rokovi vozila</TabsTrigger>
          <TabsTrigger value="services">Servisi</TabsTrigger>
          <TabsTrigger value="costs">Troškovi</TabsTrigger>
        </TabsList>

        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rokovi vozila</CardTitle>
                  <CardDescription>
                    Upravljanje rokovima registracije, tehničkih pregleda i ostalo
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingDeadline(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj/Uredi rokove
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDeadline ? "Uredi rokove vozila" : "Dodaj rokove vozila"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingDeadline ? "Uredite rokove za odabrano vozilo" : "Dodajte rokove za odabrano vozilo"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveDeadlines} className="space-y-4">
                      {!editingDeadline && (
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-select">Vozilo</Label>
                          <Select value={selectedVehicle} onValueChange={setSelectedVehicle} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Izaberite vozilo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.registration} - {vehicle.brand} {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registration_expiry">Registracija</Label>
                          <Input
                            id="registration_expiry"
                            name="registration_expiry"
                            type="date"
                            defaultValue={editingDeadline?.registration_expiry || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="technical_expiry">Tehnički (godišnji)</Label>
                          <Input
                            id="technical_expiry"
                            name="technical_expiry"
                            type="date"
                            defaultValue={editingDeadline?.technical_expiry || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="technical_6m_expiry">Tehnički (6m)</Label>
                          <Input
                            id="technical_6m_expiry"
                            name="technical_6m_expiry"
                            type="date"
                            defaultValue={editingDeadline?.technical_6m_expiry || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tachograph_calibration_expiry">Baždarenje tahografa</Label>
                          <Input
                            id="tachograph_calibration_expiry"
                            name="tachograph_calibration_expiry"
                            type="date"
                            defaultValue={editingDeadline?.tachograph_calibration_expiry || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fire_extinguisher_expiry">PP aparat</Label>
                          <Input
                            id="fire_extinguisher_expiry"
                            name="fire_extinguisher_expiry"
                            type="date"
                            defaultValue={editingDeadline?.fire_extinguisher_expiry || ''}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit">Sačuvaj rokove</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Registracija</TableHead>
                    <TableHead>Tehnički (god.)</TableHead>
                    <TableHead>Tehnički (6m)</TableHead>
                    <TableHead>Tahograf</TableHead>
                    <TableHead>PP aparat</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadlines.map((deadline) => (
                    <TableRow key={deadline.id}>
                      <TableCell className="font-medium">
                        {deadline.vehicle?.registration} - {deadline.vehicle?.brand} {deadline.vehicle?.model}
                      </TableCell>
                      <TableCell>{formatDate(deadline.registration_expiry)}</TableCell>
                      <TableCell>{formatDate(deadline.technical_expiry)}</TableCell>
                      <TableCell>{formatDate(deadline.technical_6m_expiry)}</TableCell>
                      <TableCell>{formatDate(deadline.tachograph_calibration_expiry)}</TableCell>
                      <TableCell>{formatDate(deadline.fire_extinguisher_expiry)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingDeadline(deadline)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Uredi rokove vozila</DialogTitle>
                                <DialogDescription>
                                  Uredite rokove za vozilo {deadline.vehicle?.registration}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSaveDeadlines} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="registration_expiry">Registracija</Label>
                                    <Input
                                      id="registration_expiry"
                                      name="registration_expiry"
                                      type="date"
                                      defaultValue={deadline.registration_expiry || ''}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="technical_expiry">Tehnički (godišnji)</Label>
                                    <Input
                                      id="technical_expiry"
                                      name="technical_expiry"
                                      type="date"
                                      defaultValue={deadline.technical_expiry || ''}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="technical_6m_expiry">Tehnički (6m)</Label>
                                    <Input
                                      id="technical_6m_expiry"
                                      name="technical_6m_expiry"
                                      type="date"
                                      defaultValue={deadline.technical_6m_expiry || ''}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="tachograph_calibration_expiry">Baždarenje tahografa</Label>
                                    <Input
                                      id="tachograph_calibration_expiry"
                                      name="tachograph_calibration_expiry"
                                      type="date"
                                      defaultValue={deadline.tachograph_calibration_expiry || ''}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="fire_extinguisher_expiry">PP aparat</Label>
                                    <Input
                                      id="fire_extinguisher_expiry"
                                      name="fire_extinguisher_expiry"
                                      type="date"
                                      defaultValue={deadline.fire_extinguisher_expiry || ''}
                                    />
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button type="submit">Sačuvaj rokove</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Potvrda brisanja</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ovo će trajno obrisati sve rokove za vozilo {deadline.vehicle?.registration}. Nastaviti?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDeadline(deadline.id)}>
                                  Obriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Servisi i intervencije</CardTitle>
                  <CardDescription>
                    Evidencija servisa, mali servisi i ostali radovi na vozilima
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingService(null)}>
                      <Wrench className="w-4 h-4 mr-2" />
                      Dodaj servis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? "Uredi servis" : "Novi servis"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingService ? "Uredite postojeći servis" : "Dodajte novi servis ili intervenciju"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveService} className="space-y-4">
                      {!editingService && (
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-select-service">Vozilo</Label>
                          <Select value={selectedVehicle} onValueChange={setSelectedVehicle} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Izaberite vozilo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.registration} - {vehicle.brand} {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="service_type">Tip servisa</Label>
                        <Select name="service_type" defaultValue={editingService?.service_type || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite tip servisa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mali_servis">Mali servis</SelectItem>
                            <SelectItem value="ostalo">Ostalo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_date">Datum servisa</Label>
                        <Input
                          id="service_date"
                          name="service_date"
                          type="date"
                          defaultValue={editingService?.service_date || ''}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Opis</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Opišite izvršene radove..."
                          defaultValue={editingService?.description || ''}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cost">Trošak (KM)</Label>
                          <Input
                            id="cost"
                            name="cost"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            defaultValue={editingService?.cost || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mileage">Kilometraža</Label>
                          <Input
                            id="mileage"
                            name="mileage"
                            type="number"
                            placeholder="123456"
                            defaultValue={editingService?.mileage || ''}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoice">Račun</Label>
                        <Input
                          id="invoice"
                          name="invoice"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={uploadingFile}
                        />
                        {editingService?.invoice_url && (
                          <p className="text-sm text-muted-foreground">
                            Trenutni račun: <a href={editingService.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Pogledaj</a>
                          </p>
                        )}
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={uploadingFile}>
                          {uploadingFile ? "Upload..." : editingService ? "Ažuriraj servis" : "Dodaj servis"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Trošak</TableHead>
                    <TableHead>Km</TableHead>
                    <TableHead>Račun</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.vehicle?.registration}
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.service_type === 'mali_servis' ? 'default' : 'secondary'}>
                          {service.service_type === 'mali_servis' ? 'Mali servis' : 'Ostalo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(service.service_date)}</TableCell>
                      <TableCell className="max-w-48 truncate">{service.description}</TableCell>
                      <TableCell>{service.cost ? `${service.cost} KM` : '-'}</TableCell>
                      <TableCell>{service.mileage ? `${service.mileage} km` : '-'}</TableCell>
                      <TableCell>
                        {service.invoice_url ? (
                          <a 
                            href={service.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            Pogledaj
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingService(service)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Uredi servis</DialogTitle>
                                <DialogDescription>
                                  Uredite podatke o servisu za vozilo {service.vehicle?.registration}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSaveService} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="service_type">Tip servisa</Label>
                                  <Select name="service_type" defaultValue={service.service_type || ''} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Izaberite tip servisa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mali_servis">Mali servis</SelectItem>
                                      <SelectItem value="ostalo">Ostalo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="service_date">Datum servisa</Label>
                                  <Input
                                    id="service_date"
                                    name="service_date"
                                    type="date"
                                    defaultValue={service.service_date || ''}
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="description">Opis</Label>
                                  <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Opišite izvršene radove..."
                                    defaultValue={service.description || ''}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="cost">Trošak (KM)</Label>
                                    <Input
                                      id="cost"
                                      name="cost"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      defaultValue={service.cost || ''}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="mileage">Kilometraža</Label>
                                    <Input
                                      id="mileage"
                                      name="mileage"
                                      type="number"
                                      placeholder="123456"
                                      defaultValue={service.mileage || ''}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="invoice">Račun</Label>
                                  <Input
                                    id="invoice"
                                    name="invoice"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={uploadingFile}
                                  />
                                  {service.invoice_url && (
                                    <p className="text-sm text-muted-foreground">
                                      Trenutni račun: <a href={service.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Pogledaj</a>
                                    </p>
                                  )}
                                </div>

                                <DialogFooter>
                                  <Button type="submit" disabled={uploadingFile}>
                                    {uploadingFile ? "Upload..." : "Ažuriraj servis"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Potvrda brisanja</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ovo će trajno obrisati zapis o servisu za vozilo {service.vehicle?.registration}. Nastaviti?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                  Obriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Troškovi</CardTitle>
                  <CardDescription>
                    Upravljanje općim troškovima po vozilima i vožnjama
                  </CardDescription>
                </div>
                <Button onClick={() => setAddCostModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj trošak
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip troška</TableHead>
                    <TableHead>Iznos</TableHead>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Vožnja</TableHead>
                    <TableHead>Napomena</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <Badge>
                          {cost.cost_type?.charAt(0).toUpperCase() + cost.cost_type?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{cost.amount} KM</TableCell>
                      <TableCell>{cost.vehicle?.registration || '-'}</TableCell>
                      <TableCell>
                        {cost.ride ? `${cost.ride.origin} → ${cost.ride.destination}` : '-'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{cost.note || '-'}</TableCell>
                      <TableCell>{formatDate(cost.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingCost(cost)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Uredi trošak</DialogTitle>
                                <DialogDescription>
                                  Uredite podatke o trošku
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSaveCost} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="cost_type">Tip troška</Label>
                                  <Select name="cost_type" defaultValue={cost.cost_type || ''} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Izaberite tip troška" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gorivo">Gorivo</SelectItem>
                                      <SelectItem value="servis">Servis</SelectItem>
                                      <SelectItem value="popravka">Popravka</SelectItem>
                                      <SelectItem value="registracija">Registracija</SelectItem>
                                      <SelectItem value="osiguranje">Osiguranje</SelectItem>
                                      <SelectItem value="putarina">Putarina</SelectItem>
                                      <SelectItem value="parking">Parking</SelectItem>
                                      <SelectItem value="kazna">Kazna</SelectItem>
                                      <SelectItem value="ostalo">Ostalo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="amount">Iznos (KM)</Label>
                                  <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    defaultValue={cost.amount || ''}
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="vehicle_select">Vozilo</Label>
                                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Odaberite vozilo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                          {vehicle.registration}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="ride_select">Vožnja</Label>
                                  <Select value={selectedRide} onValueChange={setSelectedRide}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Odaberite vožnju" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rides.map((ride) => (
                                        <SelectItem key={ride.id} value={ride.id}>
                                          {ride.origin} → {ride.destination} ({formatDate(ride.start_at)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="note">Napomena</Label>
                                  <Textarea
                                    id="note"
                                    name="note"
                                    placeholder="Dodatne informacije..."
                                    defaultValue={cost.note || ''}
                                  />
                                </div>

                                <DialogFooter>
                                  <Button type="submit">Ažuriraj trošak</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Potvrda brisanja</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ovo će trajno obrisati zapis o trošku od {cost.amount} KM. Nastaviti?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCost(cost.id)}>
                                  Obriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCostModal 
        open={addCostModalOpen}
        onOpenChange={setAddCostModalOpen}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MaintenanceManagement;