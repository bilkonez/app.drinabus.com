import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { EditDeadlineModal } from "@/components/ui/EditDeadlineModal";

interface VehicleReminder {
  vehicle_id: string;
  registration: string;
  kind: string;
  expiry_date: string;
  days_left: number;
}

interface EmployeeReminder {
  employee_id: string;
  employee_name: string;
  kind: string;
  expiry_date: string;
  days_left: number;
}

interface TomorrowRide {
  id: string;
  label: string;
  start_date: string;
  start_time: string;
}

const RemindersTab = () => {
  const [vehicleReminders, setVehicleReminders] = useState<VehicleReminder[]>([]);
  const [employeeReminders, setEmployeeReminders] = useState<EmployeeReminder[]>([]);
  const [tomorrowRides, setTomorrowRides] = useState<TomorrowRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    vehicleId: string;
    kind: string;
    currentDate: string;
  }>({
    isOpen: false,
    vehicleId: '',
    kind: '',
    currentDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicle reminders
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('v_vehicle_reminders_dashboard')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (vehicleError) throw vehicleError;
      setVehicleReminders(vehicleData || []);

      // Fetch employee reminders
      const { data: employeeData, error: employeeError } = await supabase
        .from('v_employee_reminders_dashboard')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (employeeError) throw employeeError;
      setEmployeeReminders(employeeData || []);

      // Fetch tomorrow's rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('v_tomorrow_rides')
        .select('*');

      if (ridesError) throw ridesError;
      setTomorrowRides(ridesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const getReminderVariant = (daysLeft: number) => {
    if (daysLeft < 0) return "destructive";
    if (daysLeft <= 7) return "destructive";
    if (daysLeft <= 30) return "secondary";
    return "secondary";
  };

  const getReminderIcon = (kind: string) => {
    switch (kind) {
      case 'Vozačka dozvola':
      case 'Tahograf kartica':
        return '👤';
      case 'Registracija':
      case 'Tehnički':
      case '6-mj Tehnički':
      case 'Baždarenje tahografa':
      case 'PP aparat':
        return '🚌';
      default:
        return '📅';
    }
  };

  const handleEditDeadline = (vehicleId: string, kind: string, currentDate: string) => {
    setEditModal({
      isOpen: true,
      vehicleId,
      kind,
      currentDate
    });
  };

  const handleCloseEditModal = () => {
    setEditModal({
      isOpen: false,
      vehicleId: '',
      kind: '',
      currentDate: ''
    });
  };

  const allReminders = [...vehicleReminders, ...employeeReminders].sort((a, b) => 
    new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Učitavanje remindara...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminderi</h2>
          <p className="text-muted-foreground">
            Pregled nadolazećih rokova i sutrašnjih vožnji
          </p>
        </div>
      </div>

      {/* Rokovi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Rokovi (30 dana)
          </CardTitle>
          <CardDescription>
            Nadolazeći rokovi za vozače i vozila
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allReminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema rokova u narednih 30 dana</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReminders.map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getReminderIcon(reminder.kind)}</span>
                    <div>
                      <p className="font-medium text-sm">
                        {'registration' in reminder ? reminder.registration : reminder.employee_name} – {reminder.kind} – {formatDate(reminder.expiry_date)} – za {reminder.days_left} dana
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {'registration' in reminder && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDeadline(reminder.vehicle_id, reminder.kind, reminder.expiry_date)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge variant={getReminderVariant(reminder.days_left)} className="text-xs">
                      za {reminder.days_left} dana
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vožnje sutra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Vožnje sutra
          </CardTitle>
          <CardDescription>
            Sve vožnje zakazane za sutra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tomorrowRides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl mb-4 block">🚍</span>
              <p>Nema vožnji za sutra 🚍</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Relacija</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Sat polaska</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tomorrowRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="font-medium">
                        {ride.label}
                      </TableCell>
                      <TableCell>
                        {formatDate(ride.start_date)}
                      </TableCell>
                      <TableCell>
                        {ride.start_time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kompletna tabela remindara */}
      {allReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kompletan pregled rokova</CardTitle>
            <CardDescription>
              Detaljni prikaz svih nadolazećih rokova
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Naziv/Vozilo</TableHead>
                    <TableHead>Datum isteka</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReminders.map((reminder, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getReminderIcon(reminder.kind)}</span>
                          <span className="text-sm">{reminder.kind}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {'registration' in reminder ? reminder.registration : reminder.employee_name}
                      </TableCell>
                      <TableCell>
                        {formatDate(reminder.expiry_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReminderVariant(reminder.days_left)}>
                          za {reminder.days_left} dana
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {'registration' in reminder && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDeadline(reminder.vehicle_id, reminder.kind, reminder.expiry_date)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Uredi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <EditDeadlineModal
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        vehicleId={editModal.vehicleId}
        kind={editModal.kind}
        currentDate={editModal.currentDate}
        onRefetch={fetchData}
      />
    </div>
  );
};

export default RemindersTab;