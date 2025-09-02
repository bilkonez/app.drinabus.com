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
import { Badge } from "@/components/ui/badge";
import { Calendar, Car, FileText, Plus, Upload, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
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
    if (!selectedVehicle) return;

    const formData = new FormData(event.currentTarget);
    const deadlineData = {
      vehicle_id: selectedVehicle,
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
    if (!selectedVehicle) return;

    const formData = new FormData(event.currentTarget);
    const fileInput = event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    
    let invoiceUrl = null;
    if (fileInput?.files?.[0]) {
      invoiceUrl = await uploadInvoice(fileInput.files[0]);
      if (!invoiceUrl) return;
    }

    const serviceData = {
      vehicle_id: selectedVehicle,
      service_type: formData.get('service_type') as string,
      description: formData.get('description') as string,
      service_date: formData.get('service_date') as string,
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null,
      invoice_url: invoiceUrl,
    };

    try {
      const { error } = await supabase
        .from('vehicle_service')
        .insert(serviceData);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Servis je uspješno dodan",
      });

      fetchData();
      setSelectedVehicle("");
      event.currentTarget.reset();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Greška",
        description: "Greška pri dodavanju servisa",
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
      const { error } = await supabase
        .from('costs')
        .insert(costData);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Trošak je uspješno dodan",
      });

      fetchData();
      setSelectedVehicle("");
      setSelectedRide("");
      event.currentTarget.reset();
    } catch (error) {
      console.error('Error saving cost:', error);
      toast({
        title: "Greška",
        description: "Greška pri dodavanju troška",
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
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj/Uredi rokove
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Rokovi vozila</DialogTitle>
                      <DialogDescription>
                        Dodajte ili uredite rokove za odabrano vozilo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveDeadlines} className="space-y-4">
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registration_expiry">Registracija</Label>
                          <Input
                            id="registration_expiry"
                            name="registration_expiry"
                            type="date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="technical_expiry">Tehnički (godišnji)</Label>
                          <Input
                            id="technical_expiry"
                            name="technical_expiry"
                            type="date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="technical_6m_expiry">Tehnički (6m)</Label>
                          <Input
                            id="technical_6m_expiry"
                            name="technical_6m_expiry"
                            type="date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tachograph_calibration_expiry">Baždarenje tahografa</Label>
                          <Input
                            id="tachograph_calibration_expiry"
                            name="tachograph_calibration_expiry"
                            type="date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fire_extinguisher_expiry">PP aparat</Label>
                          <Input
                            id="fire_extinguisher_expiry"
                            name="fire_extinguisher_expiry"
                            type="date"
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
                    <Button>
                      <Wrench className="w-4 h-4 mr-2" />
                      Dodaj servis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novi servis</DialogTitle>
                      <DialogDescription>
                        Dodajte novi servis ili intervenciju
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveService} className="space-y-4">
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

                      <div className="space-y-2">
                        <Label htmlFor="service_type">Tip servisa</Label>
                        <Select name="service_type" required>
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
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Opis</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Opis rada..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost">Cijena (KM)</Label>
                        <Input
                          id="cost"
                          name="cost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mileage">Kilometraža</Label>
                        <Input
                          id="mileage"
                          name="mileage"
                          type="number"
                          placeholder="Unesite kilometražu..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoice">Račun (PDF/slika)</Label>
                        <Input
                          id="invoice"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={uploadingFile}>
                          {uploadingFile ? (
                            <>
                              <Upload className="w-4 h-4 mr-2 animate-spin" />
                              Upload...
                            </>
                          ) : (
                            'Sačuvaj servis'
                          )}
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
                    <TableHead>Datum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Kilometraža</TableHead>
                    <TableHead>Cijena</TableHead>
                    <TableHead>Račun</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.vehicle?.registration}
                      </TableCell>
                      <TableCell>{formatDate(service.service_date)}</TableCell>
                      <TableCell>
                        <Badge variant={service.service_type === 'mali_servis' ? 'default' : 'secondary'}>
                          {service.service_type === 'mali_servis' ? 'Mali servis' : 'Ostalo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.mileage ? `${service.mileage.toLocaleString()} km` : '-'}</TableCell>
                      <TableCell>{service.cost ? `${service.cost} KM` : '-'}</TableCell>
                      <TableCell>
                        {service.invoice_url ? (
                          <a
                            href={service.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        ) : (
                          '-'
                        )}
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
                    Evidencija troškova vezanih za vozila ili vožnje
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj trošak
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novi trošak</DialogTitle>
                      <DialogDescription>
                        Dodajte novi trošak vezan za vozilo ili vožnju
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveCost} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cost_type">Tip troška</Label>
                        <Select name="cost_type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite tip troška" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gorivo">Gorivo</SelectItem>
                            <SelectItem value="putarina">Putarina</SelectItem>
                            <SelectItem value="parking">Parking</SelectItem>
                            <SelectItem value="dnevnice">Dnevnice</SelectItem>
                            <SelectItem value="servis">Servis</SelectItem>
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
                          required
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle-select-cost">Vozilo (opcionalno)</Label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite vozilo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Bez vozila</SelectItem>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.registration} - {vehicle.brand} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ride-select-cost">Vožnja (opcionalno)</Label>
                        <Select value={selectedRide} onValueChange={setSelectedRide}>
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite vožnju" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Bez vožnje</SelectItem>
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
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit">Sačuvaj trošak</Button>
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
                    <TableHead>Datum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Iznos</TableHead>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Vožnja</TableHead>
                    <TableHead>Napomena</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{formatDate(cost.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cost.cost_type.charAt(0).toUpperCase() + cost.cost_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{cost.amount} KM</TableCell>
                      <TableCell>{cost.vehicle?.registration || '-'}</TableCell>
                      <TableCell>
                        {cost.ride ? `${cost.ride.origin} → ${cost.ride.destination}` : '-'}
                      </TableCell>
                      <TableCell>{cost.note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceManagement;