import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Reminder {
  kind: string;
  title: string;
  expiry_date: string;
  days_left: number;
  ref_id: string;
}

const RemindersTab = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('v_reminders_due')
        .select('*')
        .order('days_left', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReminderIcon = (kind: string) => {
    switch (kind) {
      case 'license_expiry':
      case 'tachograph_card_expiry':
        return <Calendar className="h-4 w-4" />;
      case 'vehicle_registration':
      case 'vehicle_technical':
      case 'vehicle_technical_6m':
      case 'tachograph_calibration':
      case 'fire_extinguisher':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getReminderVariant = (daysLeft: number) => {
    if (daysLeft < 0) return "destructive";
    if (daysLeft <= 7) return "destructive";
    if (daysLeft <= 30) return "warning";
    return "secondary";
  };

  const getReminderStatus = (daysLeft: number) => {
    if (daysLeft < 0) return "Isteklo";
    if (daysLeft === 0) return "Ističe danas";
    if (daysLeft === 1) return "Ističe sutra";
    return `${daysLeft} dana`;
  };

  const getKindLabel = (kind: string) => {
    const labels: { [key: string]: string } = {
      'license_expiry': 'Vozačka dozvola',
      'tachograph_card_expiry': 'Tahograf kartica',
      'vehicle_registration': 'Registracija vozila',
      'vehicle_technical': 'Tehnički pregled',
      'vehicle_technical_6m': 'Tehnički 6m',
      'tachograph_calibration': 'Baždarenje tahografa',
      'fire_extinguisher': 'PP aparati'
    };
    return labels[kind] || kind;
  };

  const groupedReminders = reminders.reduce((groups, reminder) => {
    const priority = reminder.days_left <= 7 ? 'urgent' : reminder.days_left <= 30 ? 'soon' : 'later';
    if (!groups[priority]) groups[priority] = [];
    groups[priority].push(reminder);
    return groups;
  }, {} as { [key: string]: Reminder[] });

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
            Pregled svih nadolazećih rokova (30 dana unaprijed)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Hitno (≤7 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {groupedReminders.urgent?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              Uskoro (≤30 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {groupedReminders.soon?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ukupno remindara
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reminders.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Svi reminderi</CardTitle>
          <CardDescription>
            Kompletan pregled nadolazećih rokova
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema nadolazećih rokova u narednih 30 dana</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Datum isteka</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getReminderIcon(reminder.kind)}
                          <span className="text-sm">
                            {getKindLabel(reminder.kind)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {reminder.title}
                      </TableCell>
                      <TableCell>
                        {new Date(reminder.expiry_date).toLocaleDateString('bs-BA')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReminderVariant(reminder.days_left)}>
                          {getReminderStatus(reminder.days_left)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reminder.days_left <= 7 ? (
                          <Badge variant="destructive">Hitno</Badge>
                        ) : reminder.days_left <= 30 ? (
                          <Badge variant="warning">Uskoro</Badge>
                        ) : (
                          <Badge variant="secondary">Normalno</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersTab;