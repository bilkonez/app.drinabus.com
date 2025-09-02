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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, Route, FileText, X, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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


interface RideSegment {
  id?: string;
  start_time: string; // samo vrijeme (HH:MM)
  origin: string;
  destination: string;
  vehicle_id: string | null;
  segment_price: number | null;
  notes?: string;
}

const RideManagement = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [segments, setSegments] = useState<RideSegment[]>([]);
  const [formData, setFormData] = useState({
    ride_type: "linijski",
    origin: "",
    destination: "",
    start_at: "",
    ride_date: "", // novi field za datum lokal vožnje
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
        .in('status', ['planirano', 'zavrseno'])
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
        .from('v_employees_with_roles')
        .select('id, first_name, last_name')
        .eq('is_vozac', true)
        .eq('active', true)
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchRideSegments = async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_segments')
        .select('*')
        .eq('ride_id', rideId)
        .order('segment_start');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ride segments:', error);
      return [];
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
        start_at: formData.ride_type === 'lokal' ? 
          (formData.ride_date ? `${formData.ride_date}T00:00:00` : new Date().toISOString()) : 
          formData.start_at,
        end_at: formData.ride_type === 'lokal' ? 
          (formData.ride_date ? `${formData.ride_date}T23:59:59` : new Date().toISOString()) : 
          formData.start_at,
        vehicle_id: formData.ride_type === 'lokal' ? null : (formData.vehicle_id || null),
        driver_id: formData.driver_id || null,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        notes: formData.notes || null,
        status: formData.status,
      };

      let rideId: string;

      if (editingRide) {
        const { error } = await supabase
          .from('rides')
          .update(rideData)
          .eq('id', editingRide.id);

        if (error) throw error;
        rideId = editingRide.id;

        // Handle segments for lokal rides
        if (formData.ride_type === 'lokal') {
          // Delete existing segments
          await supabase.from('ride_segments').delete().eq('ride_id', rideId);
          
          // Insert new segments using the same date
          if (segments.length > 0) {
            const rideDate = formData.ride_date || new Date().toISOString().split('T')[0];
            
            const segmentData = segments.map(segment => ({
              ride_id: rideId,
              segment_start: `${rideDate}T${segment.start_time}:00`,
              segment_end: null,
              origin: segment.origin,
              destination: segment.destination,
              vehicle_id: segment.vehicle_id || null,
              segment_price: segment.segment_price || null,
              notes: segment.notes || null,
            }));

            const { error: segmentError } = await supabase
              .from('ride_segments')
              .insert(segmentData);

            if (segmentError) throw segmentError;
          }
        }

        toast({
          title: "Uspjeh",
          description: "Vožnja je uspješno ažurirana",
        });
      } else {
        const { data: newRideData, error } = await supabase
          .from('rides')
          .insert(rideData)
          .select()
          .single();

        if (error) throw error;
        rideId = newRideData.id;

        // Handle segments for lokal rides
        if (formData.ride_type === 'lokal' && segments.length > 0) {
          // Validate segments before inserting
          const validSegments = segments.filter(segment => 
            segment.start_time && 
            segment.origin && 
            segment.destination
          );

          if (validSegments.length === 0) {
            toast({
              title: "Greška",
              description: "Morate dodati barem jedan valjan segment sa vremenom početka, polazištem i odredištem",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Use the same date for all segments
          const rideDate = formData.ride_date || new Date().toISOString().split('T')[0];
          
          const segmentData = validSegments.map(segment => ({
            ride_id: rideId,
            segment_start: `${rideDate}T${segment.start_time}:00`,
            segment_end: null,
            origin: segment.origin,
            destination: segment.destination,
            vehicle_id: segment.vehicle_id || null,
            segment_price: segment.segment_price ? parseFloat(segment.segment_price.toString()) : null,
            notes: segment.notes || null,
          }));

          const { error: segmentError } = await supabase
            .from('ride_segments')
            .insert(segmentData);

          if (segmentError) {
            console.error('Segment error:', segmentError);
            throw segmentError;
          }
        }

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

  const openDialog = async (ride?: Ride) => {
    if (ride) {
      setEditingRide(ride);
      setFormData({
        ride_type: ride.ride_type,
        origin: ride.origin,
        destination: ride.destination,
        start_at: ride.start_at || "",
        ride_date: "",
        vehicle_id: ride.vehicle_id || "",
        driver_id: ride.driver_id || "",
        total_price: ride.total_price?.toString() || "",
        notes: ride.notes || "",
        status: ride.status,
      });

      // Load segments for lokal rides
      if (ride.ride_type === 'lokal') {
        const rideSegments = await fetchRideSegments(ride.id);
        setSegments(rideSegments.map(segment => ({
          id: segment.id,
          start_time: new Date(segment.segment_start).toISOString().slice(11, 16),
          origin: segment.origin,
          destination: segment.destination,
          vehicle_id: segment.vehicle_id,
          segment_price: segment.segment_price,
          notes: segment.notes || "",
        })));
        
        // Set ride date from first segment (all segments have same date)
        if (rideSegments.length > 0) {
          const segmentDate = new Date(rideSegments[0].segment_start);
          const rideDate = segmentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format for input[type="date"]
          setFormData(prev => ({ ...prev, ride_date: rideDate }));
        }
      } else {
        setSegments([]);
      }
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
      ride_date: "",
      vehicle_id: "",
      driver_id: "",
      total_price: "",
      notes: "",
      status: "planirano",
    });
    
    setSegments([]);
    setEditingRide(null);
  };

  const addSegment = () => {
    setSegments([...segments, {
      start_time: "",
      origin: "",
      destination: "",
      vehicle_id: null,
      segment_price: null,
      notes: "",
    }]);
  };

  const updateSegment = (index: number, field: keyof RideSegment, value: any) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const removeSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      planirano: { variant: "outline" as const, label: "Planirano" },
      zavrseno: { variant: "secondary" as const, label: "Završeno" },
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

  const generateRideReport = async (ride: Ride) => {
    try {
      // Fetch additional data for the report
      const [costsRes, documentsRes, segmentsRes] = await Promise.all([
        supabase.from('costs').select('*').eq('ride_id', ride.id),
        supabase.from('documents').select('*').eq('ride_id', ride.id),
        ride.ride_type === 'lokal' ? supabase.from('ride_segments').select('*').eq('ride_id', ride.id).order('segment_start') : Promise.resolve({ data: [] })
      ]);

      const costs = costsRes.data || [];
      const documents = documentsRes.data || [];
      
      const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
      const profit = (ride.total_price || 0) - totalCosts;

      // Create report content
      const reportData = {
        id: ride.id,
        ruta: `${ride.origin} → ${ride.destination}`,
        tip: ride.ride_type === 'linijski' ? 'Linijski prevoz' : 
             ride.ride_type === 'vanlinijski' ? 'Vanlinijski prevoz' : 'Lokal prevoz',
        datum: new Date(ride.start_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        vrijeme: new Date(ride.start_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        vozilo: ride.ride_type === 'lokal' ? 'Lokal prevoz' : getVehicleName(ride.vehicle_id),
        vozac: getDriverName(ride.driver_id),
        prihod: ride.total_price ? `${ride.total_price.toFixed(2)} KM` : 'N/A',
        troskovi: `${totalCosts.toFixed(2)} KM`,
        profit: `${profit.toFixed(2)} KM`,
        status: ride.status === 'zavrseno' ? 'Završeno' : 'Planirano',
        napomene: ride.notes || 'Nema napomena',
        brojTroskova: costs.length,
        brojDokumenata: documents.length,
        
      };

      // Generate CSV content for download
      const csvContent = [
        'Polje,Vrijednost',
        `ID vožnje,${reportData.id}`,
        `Ruta,${reportData.ruta}`,
        `Tip prevoza,${reportData.tip}`,
        `Datum,${reportData.datum}`,
        `Vrijeme,${reportData.vrijeme}`,
        `Vozilo,${reportData.vozilo}`,
        `Vozač,${reportData.vozac}`,
        `Prihod,${reportData.prihod}`,
        `Troškovi,${reportData.troskovi}`,
        `Profit,${reportData.profit}`,
        `Status,${reportData.status}`,
        `Napomene,${reportData.napomene}`,
        `Broj troškova,${reportData.brojTroskova}`,
        `Broj dokumenata,${reportData.brojDokumenata}`,
        
        '',
        'TROŠKOVI PO STAVCI:',
        'Tip,Iznos,Napomena'
      ].filter(line => line !== ''); // Remove empty lines

      // Add cost details
      costs.forEach(cost => {
        csvContent.push(`${cost.cost_type},${cost.amount} KM,${cost.note || ''}`);
      });


      const csvString = csvContent.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `voznja-izvjestaj-${ride.id.substring(0, 8)}-${reportData.datum.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Uspjeh",
        description: "Izvještaj za vožnju je uspješno generiran",
      });
    } catch (error) {
      console.error('Error generating ride report:', error);
      toast({
        title: "Greška",
        description: "Greška pri generiranju izvještaja",
        variant: "destructive",
      });
    }
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <SelectItem value="lokal">Lokal prevoz</SelectItem>
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

              {formData.ride_type !== 'lokal' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Datum polaska *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.start_at && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.start_at ? 
                              new Date(formData.start_at.split('T')[0]).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                              <span>Odaberite datum</span>
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.start_at ? new Date(formData.start_at.split('T')[0]) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const timepart = formData.start_at ? formData.start_at.split('T')[1] || '08:00:00' : '08:00:00';
                                const dateString = date.toISOString().split('T')[0];
                                setFormData({...formData, start_at: `${dateString}T${timepart}`});
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Vrijeme polaska *</Label>
                      <Input
                        id="start_time"
                        type="text"
                        pattern="[0-9]{2}:[0-9]{2}"
                        placeholder="14:30"
                        value={formData.start_at ? (formData.start_at.split('T')[1] || '').slice(0, 5) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) || value === '') {
                            const datepart = formData.start_at ? formData.start_at.split('T')[0] : new Date().toISOString().split('T')[0];
                            setFormData({...formData, start_at: `${datepart}T${value}:00`});
                          }
                        }}
                        maxLength={5}
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
                </>
              )}

              {formData.ride_type === 'lokal' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ride_date">Datum vožnje (isti za sve segmente) *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.ride_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.ride_date ? 
                            format(new Date(formData.ride_date), "dd/MM/yyyy") : 
                            "Odaberite datum"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.ride_date ? new Date(formData.ride_date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = format(date, "yyyy-MM-dd");
                              setFormData({...formData, ride_date: formattedDate});
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Segmenti vožnje</Label>
                      <Button type="button" onClick={addSegment} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj segment
                      </Button>
                    </div>
                    
                    {segments.map((segment, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Segment {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSegment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Vrijeme početka *</Label>
                          <Input
                            type="text"
                            pattern="[0-9]{2}:[0-9]{2}"
                            placeholder="14:30"
                            value={segment.start_time}
                            onChange={(e) => {
                              // Allow only HH:MM format
                              const value = e.target.value;
                              if (value.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) || value === '') {
                                updateSegment(index, 'start_time', value);
                              }
                            }}
                            maxLength={5}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Polazište *</Label>
                            <Input
                              value={segment.origin}
                              onChange={(e) => updateSegment(index, 'origin', e.target.value)}
                              placeholder="Sarajevo"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Odredište *</Label>
                            <Input
                              value={segment.destination}
                              onChange={(e) => updateSegment(index, 'destination', e.target.value)}
                              placeholder="Beograd"
                              required
                            />
                          </div>
                        </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Vozilo</Label>
                          <Select 
                            value={segment.vehicle_id || ""} 
                            onValueChange={(value) => updateSegment(index, 'vehicle_id', value || null)}
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
                        <div>
                          <Label className="text-xs">Cijena (KM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={segment.segment_price || ""}
                            onChange={(e) => updateSegment(index, 'segment_price', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Napomene</Label>
                        <Input
                          value={segment.notes || ""}
                          onChange={(e) => updateSegment(index, 'notes', e.target.value)}
                          placeholder="Napomene za segment..."
                        />
                      </div>
                       </div>
                     ))}
                   </div>
                 </>
               )}

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
                    <SelectItem value="zavrseno">Završeno</SelectItem>
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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Sve vožnje
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
                      <TableHead>Datum/Sat</TableHead>
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
                      const rideDate = new Date(ride.start_at);
                      return (
                        <TableRow key={ride.id}>
                          <TableCell className="font-medium">
                            {ride.origin} → {ride.destination}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ride.ride_type === 'linijski' ? 'Linijski' : 
                               ride.ride_type === 'vanlinijski' ? 'Vanlinijski' : 'Lokal'}
                            </Badge>
                          </TableCell>
                           <TableCell>
                              <div className="text-sm">
                                 {rideDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                <div className="text-muted-foreground">
                                  {ride.ride_type === 'lokal' ? 'Više segmenata' : 
                                   rideDate.toLocaleTimeString('en-GB', { 
                                     hour: '2-digit', 
                                     minute: '2-digit',
                                     hour12: false 
                                   })
                                  }
                                </div>
                              </div>
                           </TableCell>
                           <TableCell className="text-sm">
                             {ride.ride_type === 'lokal' ? 'Lokal prevoz' : getVehicleName(ride.vehicle_id)}
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
                                onClick={() => generateRideReport(ride)}
                                title="Generiši izvještaj za vožnju"
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Završene vožnje
            </CardTitle>
            <CardDescription>
              {rides.filter(ride => ride.status === 'zavrseno').length} završenih vožnji
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Učitavanje...</p>
              </div>
            ) : rides.filter(ride => ride.status === 'zavrseno').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nema završenih vožnji</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rides
                  .filter(ride => ride.status === 'zavrseno')
                  .map((ride) => {
                    const rideDate = new Date(ride.start_at);
                    return (
                      <div key={ride.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {ride.origin} → {ride.destination}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Završeno
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Datum:</span> {rideDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                          <div>
                             <span className="font-medium">Sat:</span> {rideDate.toLocaleTimeString('en-GB', { 
                               hour: '2-digit', 
                               minute: '2-digit',
                               hour12: false 
                             })}
                          </div>
                          <div>
                            <span className="font-medium">Vozilo:</span> {getVehicleName(ride.vehicle_id)}
                          </div>
                          <div>
                            <span className="font-medium">Cijena:</span> {ride.total_price ? `${ride.total_price.toFixed(2)} KM` : 'N/A'}
                          </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(ride)}
                            className="h-6 px-2 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateRideReport(ride)}
                            title="Generiši izvještaj za vožnju"
                            className="h-6 px-2 text-xs"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RideManagement;