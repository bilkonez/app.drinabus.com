import React, { useState, useEffect } from "react";
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
  return_date: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  total_price: number | null;
  notes: string | null;
  status: string;
  client_name: string | null;
  payment_type: string | null;
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
    return_date: "", // datum povratka za vanlinijski
    vehicle_id: "",
    driver_id: "",
    total_price: "",
    notes: "",
    status: "planirano",
    client_name: "",
    payment_type: "K", // Default na "Kesh"
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
        .order('start_at', { ascending: true });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast({
        title: "Greska",
        description: "Greska prilikom ucitavanja voznji",
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
      const { toDbIsoFromLocal, getCurrentLocalDate, getCurrentLocalTime } = await import('@/lib/datetime');
      
      // Handle start_at based on ride type
      let startAt: string;
      
      // Check if we're editing and the datetime hasn't changed
      const hasDateTimeChanged = editingRide && (
        (formData.ride_type !== 'lokal' && formData.start_at) ||
        (formData.ride_type === 'lokal' && formData.ride_date)
      );
      
      if (editingRide && !hasDateTimeChanged) {
        // Keep original start_at if user didn't change date/time
        startAt = editingRide.start_at;
      } else if (formData.ride_type === 'lokal') {
        const date = formData.ride_date || getCurrentLocalDate();
        startAt = toDbIsoFromLocal(date, '00:00');
      } else {
        // For linijski/vanlinijski rides, parse the datetime string
        if (formData.start_at) {
          const [date, time] = formData.start_at.split('T');
          startAt = toDbIsoFromLocal(date, time.substring(0, 5));
        } else {
          startAt = toDbIsoFromLocal(getCurrentLocalDate(), getCurrentLocalTime());
        }
      }
      
      const rideData = {
        ride_type: formData.ride_type,
        origin: formData.origin,
        destination: formData.destination,
        start_at: startAt,
        end_at: formData.ride_type === 'lokal' ? 
          (formData.ride_date ? `${formData.ride_date}T23:59:59` : new Date().toISOString()) : 
          formData.start_at,
        return_date: formData.ride_type === 'vanlinijski' && formData.return_date ? formData.return_date : null,
        vehicle_id: formData.ride_type === 'lokal' ? null : (formData.vehicle_id || null),
        driver_id: formData.driver_id || null,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        notes: formData.notes || null,
        status: formData.status,
        client_name: formData.client_name || null,
        payment_type: formData.payment_type || 'K',
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
          title: "Uspeh",
          description: "Voznja je uspesno azurirana",
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
              title: "Greska",
              description: "Morate dodati barem jedan valjan segment sa vremenom pocetka, polazistem i odredistem",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          // Use the same date for all segments
          const rideDate = formData.ride_date || getCurrentLocalDate();
          
          const segmentData = validSegments.map(segment => ({
            ride_id: rideId,
            segment_start: toDbIsoFromLocal(rideDate, segment.start_time),
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
          title: "Uspeh",
          description: "Voznja je uspesno dodata",
        });
      }

      setDialogOpen(false);
      resetForm();
      
      // Refresh all ride-related data including calendar and mini-calendar
      await Promise.all([fetchRides()]);
    } catch (error) {
      console.error('Error saving ride:', error);
      toast({
        title: "Greska",
        description: "Greska prilikom cuvanja voznje",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da zelite obrisati ovu voznju?')) return;

    try {
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspeh",
        description: "Voznja je uspesno obrisana",
      });

      await Promise.all([fetchRides()]);
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Greska",
        description: "Greska prilikom brisanja voznje",
        variant: "destructive",
      });
    }
  };

  const openDialog = async (ride?: Ride) => {
    if (ride) {
      setEditingRide(ride);
      
      const { localDateFromDb, localTimeFromDb } = await import('@/lib/datetime');
      
      // For non-lokal rides, use proper timezone conversion
      let startAtValue = "";
      if (ride.ride_type !== 'lokal' && ride.start_at) {
        const date = localDateFromDb(ride.start_at);
        const time = localTimeFromDb(ride.start_at);
        startAtValue = `${date}T${time}`;
      }
      
      setFormData({
        ride_type: ride.ride_type,
        origin: ride.origin,
        destination: ride.destination,
        start_at: startAtValue,
        ride_date: "",
        return_date: ride.return_date || "",
        vehicle_id: ride.vehicle_id || "",
        driver_id: ride.driver_id || "",
        total_price: ride.total_price?.toString() || "",
        notes: ride.notes || "",
        status: ride.status,
        client_name: ride.client_name || "",
        payment_type: ride.payment_type || "K",
      });

      // Load segments for lokal rides
      if (ride.ride_type === 'lokal') {
        const rideSegments = await fetchRideSegments(ride.id);
        setSegments(rideSegments.map(segment => ({
          id: segment.id,
          start_time: localTimeFromDb(segment.segment_start),
          origin: segment.origin,
          destination: segment.destination,
          vehicle_id: segment.vehicle_id,
          segment_price: segment.segment_price,
          notes: segment.notes || "",
        })));
        
        // Set ride date from first segment (all segments have same date)
        if (rideSegments.length > 0) {
          const rideDate = localDateFromDb(rideSegments[0].segment_start);
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
      return_date: "",
      vehicle_id: "",
      driver_id: "",
      total_price: "",
      notes: "",
      status: "planirano",
      client_name: "",
      payment_type: "K",
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
      zavrseno: { variant: "secondary" as const, label: "Zavrseno" },
    };
    return variants[status as keyof typeof variants] || { variant: "outline" as const, label: status };
  };

  // Group rides by date and sort so future dates come first
  const groupedRides = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const groups: { [key: string]: Ride[] } = {};
    
    rides.forEach(ride => {
      const rideDate = new Date(ride.start_at);
      const dateKey = rideDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ride);
    });

    // Sort dates so future dates come first, then past dates
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      
      const isAFuture = dateA >= today;
      const isBFuture = dateB >= today;
      
      // Future dates first
      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;
      
      // Among future dates, earliest first
      if (isAFuture && isBFuture) return dateA.getTime() - dateB.getTime();
      
      // Among past dates, latest first
      return dateB.getTime() - dateA.getTime();
    });

    return sortedDates.map(date => ({
      date,
      rides: groups[date].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    }));
  }, [rides]);

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
        status: ride.status === 'zavrseno' ? 'Zavrseno' : 'Planirano',
        napomene: ride.notes || 'Nema napomena',
        brojTroskova: costs.length,
        brojDokumenata: documents.length,
        
      };

      // Generate CSV content for download
      const csvContent = [
        'Polje,Vrednost',
        `ID voznje,${reportData.id}`,
        `Ruta,${reportData.ruta}`,
        `Tip prevoza,${reportData.tip}`,
        `Datum,${reportData.datum}`,
        `Vreme,${reportData.vrijeme}`,
        `Vozilo,${reportData.vozilo}`,
        `Vozac,${reportData.vozac}`,
        `Prihod,${reportData.prihod}`,
        `Troskovi,${reportData.troskovi}`,
        `Profit,${reportData.profit}`,
        `Status,${reportData.status}`,
        `Napomene,${reportData.napomene}`,
        `Broj troskova,${reportData.brojTroskova}`,
        `Broj dokumenata,${reportData.brojDokumenata}`,
        
        '',
        'TROSKOVI PO STAVCI:',
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
      link.setAttribute('download', `voznja-izvestaj-${ride.id.substring(0, 8)}-${reportData.datum.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Uspeh",
        description: "Izvestaj za voznju je uspesno generisan",
      });
    } catch (error) {
      console.error('Error generating ride report:', error);
      toast({
        title: "Greska",
        description: "Greska pri generisanju izvestaja",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Voznje</h2>
          <p className="text-muted-foreground">
            Upravljanje voznjama i transportom
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj voznju
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRide ? "Uredi voznju" : "Dodaj novu voznju"}
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
                  <Label htmlFor="origin">Polaziste *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    required
                    placeholder="Sarajevo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Odrediste *</Label>
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
                            selected={formData.start_at ? new Date(formData.start_at.split('T')[0] + 'T12:00:00') : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const timepart = formData.start_at ? formData.start_at.split('T')[1] || '08:00:00' : '08:00:00';
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateString = `${year}-${month}-${day}`;
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
                      <Label htmlFor="start_time">Vreme polaska *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        step="60"
                        value={formData.start_at ? (formData.start_at.split('T')[1] || '').slice(0, 5) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const datepart = formData.start_at ? formData.start_at.split('T')[0] : new Date().toISOString().split('T')[0];
                          setFormData({...formData, start_at: `${datepart}T${value}:00`});
                        }}
                        required
                      />
                    </div>
                   </div>

                   {formData.ride_type === 'vanlinijski' && (
                     <div className="space-y-2">
                       <Label htmlFor="return_date">Datum povratka</Label>
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button
                             variant="outline"
                             className={cn(
                               "w-full justify-start text-left font-normal",
                               !formData.return_date && "text-muted-foreground"
                             )}
                           >
                             <CalendarIcon className="mr-2 h-4 w-4" />
                             {formData.return_date ? 
                               new Date(formData.return_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                               <span>Odaberite datum povratka</span>
                             }
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                             mode="single"
                             selected={formData.return_date ? new Date(formData.return_date) : undefined}
                             onSelect={(date) => {
                               if (date) {
                                 const year = date.getFullYear();
                                 const month = String(date.getMonth() + 1).padStart(2, '0');
                                 const day = String(date.getDate()).padStart(2, '0');
                                 const dateString = `${year}-${month}-${day}`;
                                 setFormData({...formData, return_date: dateString});
                               }
                             }}
                             initialFocus
                             className={cn("p-3 pointer-events-auto")}
                           />
                         </PopoverContent>
                       </Popover>
                     </div>
                   )}

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
                    <Label htmlFor="ride_date">Datum voznje (isti za sve segmente) *</Label>
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
                      <Label className="text-base font-semibold">Segmenti voznje</Label>
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
                          <Label className="text-xs">Vreme pocetka *</Label>
                          <Input
                            type="time"
                            step="60"
                            value={segment.start_time}
                            onChange={(e) => updateSegment(index, 'start_time', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Polaziste *</Label>
                            <Input
                              value={segment.origin}
                              onChange={(e) => updateSegment(index, 'origin', e.target.value)}
                              placeholder="Sarajevo"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Odrediste *</Label>
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
                         <Label className="text-xs">Cena (KM)</Label>
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
                <Label htmlFor="driver_id">Vozac</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite vozaca" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Ime klijenta</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    placeholder="Naziv klijenta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Nacin placanja</Label>
                  <Select value={formData.payment_type} onValueChange={(value) => setFormData({...formData, payment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">F - Faktura</SelectItem>
                      <SelectItem value="K">K - Kesh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_price">Ukupna cena (KM)</Label>
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
                    <SelectItem value="zavrseno">Zavrseno</SelectItem>
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
                  {loading ? "Cuvanje..." : "Sacuvaj"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Otkazi
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
              Sve voznje
            </CardTitle>
            <CardDescription>
              {rides.length} voznji u sistemu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Ucitavanje voznji...</p>
              </div>
            ) : rides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nema voznji u bazi</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedRides.map(({ date, rides: dateRides }) => {
                  const dateObj = new Date(date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = dateObj.getTime() === today.getTime();
                  const isFuture = dateObj >= today;
                  
                  return (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isToday ? 'bg-primary text-primary-foreground' :
                          isFuture ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isToday ? 'Danas' : 
                           dateObj.toLocaleDateString('sr-RS', { 
                             weekday: 'long', 
                             year: 'numeric', 
                             month: 'long', 
                             day: 'numeric' 
                           })}
                        </div>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-sm text-muted-foreground">
                          {dateRides.length} {dateRides.length === 1 ? 'voznja' : 'voznji'}
                        </span>
                      </div>
                      
                      <Card className={`${isFuture ? 'ring-1 ring-green-200 dark:ring-green-800' : ''}`}>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Relacija</TableHead>
                                  <TableHead>Tip</TableHead>
                                  <TableHead>Vreme</TableHead>
                                  <TableHead>Klijent</TableHead>
                                  <TableHead>Vozilo</TableHead>
                                  <TableHead>Vozac</TableHead>
                                  <TableHead>Cena</TableHead>
                                  <TableHead>Placanje</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Akcije</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dateRides.map((ride) => {
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
                                        <div className="text-sm font-medium">
                                          {ride.ride_type === 'lokal' ? 'Vise segmenata' : 
                                           rideDate.toLocaleTimeString('en-GB', { 
                                             hour: '2-digit', 
                                             minute: '2-digit',
                                             hour12: false 
                                           })
                                          }
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {ride.client_name || 'N/A'}
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
                                        <Badge variant={ride.payment_type === 'F' ? 'secondary' : 'outline'}>
                                          {ride.payment_type === 'F' ? 'Faktura' : 'Kesh'}
                                        </Badge>
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
                                             title="Generisi izvestaj za voznju"
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
                        </CardContent>
                      </Card>
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