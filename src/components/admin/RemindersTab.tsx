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

  const getReminderVariant = (daysLeft: number) => {
    if (daysLeft < 0) return "destructive";
    if (daysLeft <= 7) return "destructive";
    if (daysLeft <= 30) return "secondary";
    return "secondary";
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
            Pregled svih nadolazećih rokova (30 dana unaprijed)
          </p>
        </div>
      </div>

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
                    <TableHead>Naziv</TableHead>
                    <TableHead>Datum isteka</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {reminder.title}
                      </TableCell>
                      <TableCell>
                        {new Date(reminder.expiry_date).toLocaleDateString('bs-BA')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReminderVariant(reminder.days_left)}>
                          {reminder.days_left} dana
                        </Badge>
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