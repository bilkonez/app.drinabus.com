import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Reminder {
  kind: string;
  title: string;
  expiry_date: string;
  days_left: number;
  ref_id: string;
}

interface TomorrowRide {
  id: string;
  label: string;
  start_date: string;
  start_time: string;
}

const RemindersTab = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tomorrowRides, setTomorrowRides] = useState<TomorrowRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reminders
      const { data: reminderData, error: reminderError } = await supabase
        .from('v_reminders_due')
        .select('*')
        .order('days_left', { ascending: true });

      if (reminderError) throw reminderError;
      setReminders(reminderData || []);

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
      case 'vozac_licenca':
      case 'vozac_tahograf_kartica':
        return '👤';
      case 'vozilo_registracija':
      case 'vozilo_tehnicki':
      case 'vozilo_tehnicki_6m':
      case 'vozilo_tahograf_bazdarenje':
      case 'vozilo_pp_aparat':
        return '🚌';
      default:
        return '📅';
    }
  };

  const getKindLabel = (kind: string) => {
    const labels: Record<string, string> = {
      'vozac_licenca': 'Vozačka dozvola',
      'vozac_tahograf_kartica': 'Tahograf kartica',
      'vozilo_registracija': 'Registracija',
      'vozilo_tehnicki': 'Tehnički pregled',
      'vozilo_tehnicki_6m': 'Tehnički pregled (6m)',
      'vozilo_tahograf_bazdarenje': 'Baždarenje tahografa',
      'vozilo_pp_aparat': 'PP aparat'
    };
    return labels[kind] || kind;
  };

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
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema nadolazećih rokova u narednih 30 dana</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getReminderIcon(reminder.kind)}</span>
                    <div>
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getKindLabel(reminder.kind)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(reminder.expiry_date)}</p>
                    <Badge variant={getReminderVariant(reminder.days_left)} className="text-xs">
                      {reminder.days_left >= 0 ? `${reminder.days_left} dana` : `Prošao ${Math.abs(reminder.days_left)} dana`}
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
      {reminders.length > 0 && (
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
                    <TableHead>Naziv</TableHead>
                    <TableHead>Datum isteka</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getReminderIcon(reminder.kind)}</span>
                          <span className="text-sm">{getKindLabel(reminder.kind)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {reminder.title}
                      </TableCell>
                      <TableCell>
                        {formatDate(reminder.expiry_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReminderVariant(reminder.days_left)}>
                          {reminder.days_left >= 0 ? `${reminder.days_left} dana` : `Prošao ${Math.abs(reminder.days_left)} dana`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RemindersTab;