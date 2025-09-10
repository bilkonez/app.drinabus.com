import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as BigCalendar, dayjsLocalizer, Views } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/bs'; // Bosnian locale
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
import duration from 'dayjs/plugin/duration';
import { calendarDateFromDb, formatDisplayDateTime } from '@/lib/datetime';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.locale('bs');

// Set default timezone to Europe/Sarajevo
dayjs.tz.setDefault('Europe/Sarajevo');
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Filter, Plus, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';

const localizer = dayjsLocalizer(dayjs);

interface CalendarEvent {
  ride_id: string;
  segment_id?: string | null;
  ride_type: string;
  status: string;
  title: string;
  event_start: string;
  event_end?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  total_price?: number | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Vehicle {
  id: string;
  registration: string;
  brand: string;
  model: string;
}

const Calendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [currentView, setCurrentView] = useState<any>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('svi');
  const [statusFilter, setStatusFilter] = useState<string>('svi');
  const [driverFilter, setDriverFilter] = useState<string>('svi');
  const [vehicleFilter, setVehicleFilter] = useState<string>('svi');

  // Fetch calendar events
  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_calendar_events')
        .select('*')
        .order('event_start', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Greška",
        description: "Neuspješno učitavanje događaja iz kalendara",
        variant: "destructive",
      });
    }
  }, []);

  // Fetch employees and vehicles for filters
  const fetchFilterData = useCallback(async () => {
    try {
      const [employeesResult, vehiclesResult] = await Promise.all([
        supabase.from('v_employees_with_roles').select('id, first_name, last_name').eq('is_vozac', true).eq('active', true),
        supabase.from('vehicles').select('id, registration, brand, model').eq('status', 'dostupno')
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (vehiclesResult.error) throw vehiclesResult.error;

      setEmployees(employeesResult.data || []);
      setVehicles(vehiclesResult.data || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  }, []);

  // Apply filters to events
  const applyFilters = useCallback(() => {
    let filtered = events;

    if (typeFilter !== 'svi') {
      filtered = filtered.filter(event => event.ride_type === typeFilter);
    }

    if (statusFilter !== 'svi') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    if (driverFilter !== 'svi') {
      filtered = filtered.filter(event => event.driver_id === driverFilter);
    }

    if (vehicleFilter !== 'svi') {
      filtered = filtered.filter(event => event.vehicle_id === vehicleFilter);
    }

    // Convert to calendar format - times are already in local timezone from the view
    const calendarEvents = filtered.map(event => ({
      ...event,
      id: event.segment_id || event.ride_id,
      start: calendarDateFromDb(event.event_start),
      end: event.event_end ? calendarDateFromDb(event.event_end) : dayjs(calendarDateFromDb(event.event_start)).add(1, 'hour').toDate(),
      allDay: false, // Always set to false to prevent "next day" display
      resource: event
    }));

    setFilteredEvents(calendarEvents);
  }, [events, typeFilter, statusFilter, driverFilter, vehicleFilter]);

  // Load data on component mount and set up real-time listeners
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchFilterData()]);
      setLoading(false);
    };
    
    loadData();

    // Set up Supabase real-time listeners
    const channel = supabase.channel('calendar-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rides' 
      }, () => {
        console.log('Rides table changed, refetching events...');
        fetchEvents();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ride_segments' 
      }, () => {
        console.log('Ride segments table changed, refetching events...');
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, fetchFilterData]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Event style function
  const eventStyleGetter = useCallback((event: any) => {
    const eventData = event.resource as CalendarEvent;
    
    let backgroundColor = '#3174ad'; // Default blue for linijski
    let borderColor = '#3174ad';
    
    // Type colors
    if (eventData.ride_type === 'vanlinijski') {
      backgroundColor = '#f59e0b'; // Amber
      borderColor = '#f59e0b';
    } else if (eventData.ride_type === 'lokal') {
      backgroundColor = '#8b5cf6'; // Violet
      borderColor = '#8b5cf6';
    }
    
    // Status opacity
    const opacity = eventData.status === 'zavrseno' ? 0.6 : 1;
    
    return {
      style: {
        backgroundColor,
        borderColor,
        opacity,
        color: 'white',
        border: `1px solid ${borderColor}`,
        fontSize: '12px',
        padding: '2px 4px',
        borderRadius: '4px'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource);
    setShowEventDialog(true);
  }, []);

  // Handle event drop (drag and drop)
  const moveEvent = useCallback(async ({ event, start, end }: any) => {
    const eventData = event.resource as CalendarEvent;
    
    // Only allow moving planned events
    if (eventData.status !== 'planirano') {
      toast({
        title: "Upozorenje",
        description: "Možete pomjerati samo planirane vožnje",
        variant: "destructive",
      });
      return;
    }

    try {
      if (eventData.segment_id) {
        // Update segment - convert local time to UTC for storage
        const durationMinutes = eventData.event_end 
          ? dayjs(eventData.event_end).diff(dayjs(eventData.event_start), 'minute')
          : 60;
        
        const newEnd = dayjs(start).add(durationMinutes, 'minute');
        
        const { error } = await supabase
          .from('ride_segments')
          .update({
            segment_start: dayjs(start).utc().toISOString(),
            segment_end: newEnd.utc().toISOString()
          })
          .eq('id', eventData.segment_id);

        if (error) throw error;
      } else {
        // Update ride - convert local time to UTC for storage
        const { error } = await supabase
          .from('rides')
          .update({ start_at: dayjs(start).utc().toISOString() })
          .eq('id', eventData.ride_id);

        if (error) throw error;
      }

      // Refresh events and notify other components
      await Promise.all([fetchEvents()]);
      
      toast({
        title: "Uspjeh",
        description: "Vožnja je uspješno premeštena",
      });
    } catch (error) {
      console.error('Error moving event:', error);
      toast({
        title: "Greška",
        description: "Neuspješno premještanje vožnje",
        variant: "destructive",
      });
    }
  }, [fetchEvents]);

  // Handle mark as completed
  const markAsCompleted = useCallback(async (eventData: CalendarEvent) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'zavrseno' })
        .eq('id', eventData.ride_id);

      if (error) throw error;

      await Promise.all([fetchEvents()]);
      setShowEventDialog(false);
      
      toast({
        title: "Uspjeh",
        description: "Vožnja je označena kao završena",
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: "Greška",
        description: "Neuspješno označavanje vožnje kao završene",
        variant: "destructive",
      });
    }
  }, [fetchEvents]);

  // Get driver name
  const getDriverName = useCallback((driverId?: string) => {
    if (!driverId) return 'Nepoznat vozač';
    const driver = employees.find(emp => emp.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Nepoznat vozač';
  }, [employees]);

  // Get vehicle name
  const getVehicleName = useCallback((vehicleId?: string) => {
    if (!vehicleId) return 'Nepoznato vozilo';
    const vehicle = vehicles.find(veh => veh.id === vehicleId);
    return vehicle ? `${vehicle.registration} (${vehicle.brand} ${vehicle.model})` : 'Nepoznato vozilo';
  }, [vehicles]);

  const messages = {
    allDay: 'Cijeli dan',
    previous: 'Prethodni',
    next: 'Sljedeći',
    today: 'Danas',
    month: 'Mjesec',
    week: 'Sedmica',
    day: 'Dan',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Vrijeme',
    event: 'Događaj',
    noEventsInRange: 'Nema događaja u ovom vremenskom opsegu',
    showMore: (total: number) => `+ Prikaži još (${total})`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Učitavanje kalendara...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
                Nazad na Dashboard
              </Button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Kalendar vožnji</h1>
                <p className="text-lg text-muted-foreground">Pregled i upravljanje vožnjama po datumu</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="lg" className="min-w-[180px] justify-start text-left font-medium shadow-sm">
                  <CalendarIcon className="mr-3 h-5 w-5" />
                  {dayjs(currentDate).format("DD/MM/YYYY")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePicker
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              Filtri za pretragu
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Tip vožnje</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 shadow-sm">
                    <SelectValue placeholder="Svi tipovi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svi">🚌 Svi tipovi</SelectItem>
                    <SelectItem value="linijski">🛣️ Linijski</SelectItem>
                    <SelectItem value="vanlinijski">🌍 Vanlinijski</SelectItem>
                    <SelectItem value="lokal">🏠 Lokal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 shadow-sm">
                    <SelectValue placeholder="Svi statusi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svi">📋 Svi statusi</SelectItem>
                    <SelectItem value="planirano">⏰ Planirano</SelectItem>
                    <SelectItem value="zavrseno">✅ Završeno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Vozač</label>
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger className="h-11 shadow-sm">
                    <SelectValue placeholder="Svi vozači" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svi">👥 Svi vozači</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        🚗 {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Vozilo</label>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="h-11 shadow-sm">
                    <SelectValue placeholder="Sva vozila" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svi">🚛 Sva vozila</SelectItem>
                    {vehicles.map(veh => (
                      <SelectItem key={veh.id} value={veh.id}>
                        🚐 {veh.registration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold">Kalendarski pregled</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📅</span>
                <span>{filteredEvents.length} događaja</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: '75vh' }} className="bg-background">
              <BigCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                onEventDrop={moveEvent}
                eventPropGetter={eventStyleGetter}
                view={currentView}
                date={currentDate}
                onView={setCurrentView}
                onNavigate={setCurrentDate}
                messages={messages}
                formats={{
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    dayjs(start).format('HH:mm') + ' - ' + dayjs(end).format('HH:mm'),
                  dayFormat: (date, culture, localizer) =>
                    dayjs(date).format('DD/MM'),
                  dayHeaderFormat: (date, culture, localizer) =>
                    dayjs(date).format('dddd DD/MM'),
                  monthHeaderFormat: (date, culture, localizer) =>
                    dayjs(date).format('MMMM YYYY'),
                }}
                draggableAccessor={(event: any) => event.resource.status === 'planirano'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detalji događaja</DialogTitle>
              <DialogDescription>
                Informacije o odabranom događaju
              </DialogDescription>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDisplayDateTime(selectedEvent.event_start)}
                    {selectedEvent.event_end && ` - ${formatDisplayDateTime(selectedEvent.event_end)}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge variant={
                    selectedEvent.ride_type === 'linijski' ? 'default' :
                    selectedEvent.ride_type === 'vanlinijski' ? 'secondary' : 'outline'
                  }>
                    {selectedEvent.ride_type}
                  </Badge>
                  <Badge variant={selectedEvent.status === 'planirano' ? 'default' : 'secondary'}>
                    {selectedEvent.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Vozač: </span>
                    <span className="text-muted-foreground">{getDriverName(selectedEvent.driver_id)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Vozilo: </span>
                    <span className="text-muted-foreground">{getVehicleName(selectedEvent.vehicle_id)}</span>
                  </div>
                  {selectedEvent.total_price && (
                    <div>
                      <span className="font-medium">Cijena: </span>
                      <span className="text-muted-foreground">{selectedEvent.total_price} KM</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedEvent.status === 'planirano' && (
                    <Button 
                      onClick={() => markAsCompleted(selectedEvent)}
                      className="flex-1"
                    >
                      Označi kao završeno
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEventDialog(false)}
                    className="flex-1"
                  >
                    Zatvori
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Calendar;