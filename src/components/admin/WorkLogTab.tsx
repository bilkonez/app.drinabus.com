import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Download, Save, Trash2, Clock, Users, FileDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, getDaysInMonth, startOfMonth, addMonths, isValid, parseISO } from 'date-fns';

// Serbian/Bosnian month names
const monthNames: { [key: number]: string } = {
  0: 'JANUAR',
  1: 'FEBRUAR', 
  2: 'MART',
  3: 'APRIL',
  4: 'MAJ',
  5: 'JUNI',
  6: 'JULI',
  7: 'AUGUST',
  8: 'SEPTEMBAR',
  9: 'OKTOBAR',
  10: 'NOVEMBAR',
  11: 'DECEMBAR'
};

const getMonthName = (date: Date): string => {
  return monthNames[date.getMonth()];
};

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

interface WorkLogEntry {
  id?: string;
  employee_id: string;
  work_date: string;
  hours: number;
  note?: string;
}

interface MonthlyEntry {
  date: string;
  hours: number | null;
  note: string;
  hasExistingRecord: boolean;
  id?: string;
}

const WorkLogTab = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch drivers with driver role
  const fetchDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_employees_with_roles')
        .select('id, first_name, last_name')
        .eq('is_vozac', true)
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Greška",
        description: "Neuspješno učitavanje vozača",
        variant: "destructive",
      });
    }
  }, []);

  // Generate monthly template (1-31 days)
  const generateMonthlyTemplate = useCallback((date: Date): MonthlyEntry[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(date);
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      return {
        date: dateStr,
        hours: null,
        note: '',
        hasExistingRecord: false
      };
    });
  }, []);

  // Fetch work log entries for selected driver and month
  const fetchWorkLogEntries = useCallback(async () => {
    if (!selectedDriverId || selectedDriverId === 'svi' || !selectedMonth) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('driver_work_log')
        .select('*')
        .eq('employee_id', selectedDriverId)
        .gte('work_date', format(startDate, 'yyyy-MM-dd'))
        .lte('work_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Generate template and populate with existing data
      const template = generateMonthlyTemplate(selectedMonth);
      const populatedEntries = template.map(entry => {
        const existingEntry = data?.find(d => d.work_date === entry.date);
        if (existingEntry) {
          return {
            ...entry,
            id: existingEntry.id,
            hours: existingEntry.hours ? parseFloat(existingEntry.hours.toString()) : 0,
            note: existingEntry.note || '',
            hasExistingRecord: true
          };
        }
        return entry;
      });

      setMonthlyEntries(populatedEntries);
    } catch (error) {
      console.error('Error fetching work log entries:', error);
      toast({
        title: "Greška",
        description: "Neuspješno učitavanje evidencije rada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDriverId, selectedMonth, generateMonthlyTemplate]);

  // Update hours for a specific date
  const updateHours = useCallback((date: string, hours: number | null) => {
    setMonthlyEntries(prev => prev.map(entry => 
      entry.date === date ? { ...entry, hours } : entry
    ));
  }, []);

  // Update note for a specific date
  const updateNote = useCallback((date: string, note: string) => {
    setMonthlyEntries(prev => prev.map(entry => 
      entry.date === date ? { ...entry, note } : entry
    ));
  }, []);

  // Fill month with working days (Mon-Fri with 8 hours)
  const fillWorkingDays = useCallback(() => {
    setMonthlyEntries(prev => prev.map(entry => {
      const date = new Date(entry.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        return { ...entry, hours: entry.hours || 8 };
      } else {
        return { ...entry, hours: entry.hours || 0 };
      }
    }));
    
    toast({
      title: "Uspjeh",
      description: "Popunjeni radni dani (pon-pet sa 8h)",
    });
  }, []);

  // Calculate total dnevnice
  const totalDnevnice = useMemo(() => {
    return monthlyEntries.reduce((sum, entry) => {
      // Provjeriti da li je note broj ili string koji sadrži broj
      const noteValue = entry.note || '0';
      const dnevnica = parseFloat(noteValue.toString()) || 0;
      return sum + dnevnica;
    }, 0);
  }, [monthlyEntries]);

  // Save all entries
  const saveAllEntries = useCallback(async () => {
    if (!selectedDriverId || selectedDriverId === 'svi') return;

    setSaving(true);
    try {
      const entriesToUpsert: Omit<WorkLogEntry, 'id'>[] = [];
      const entriesToDelete: string[] = [];

      for (const entry of monthlyEntries) {
        const shouldSave = entry.hours !== null && entry.hours > 0;
        const hasNote = entry.note && entry.note.trim().length > 0;
        
        if (shouldSave || hasNote) {
          // Ensure we have a valid hours value when saving
          const hoursValue = entry.hours && entry.hours > 0 ? entry.hours : 0;
          
          entriesToUpsert.push({
            employee_id: selectedDriverId,
            work_date: entry.date,
            hours: hoursValue,
            note: entry.note || null
          });
        } else if (entry.hasExistingRecord && entry.id) {
          entriesToDelete.push(entry.id);
        }
      }

      // Delete entries that should be removed
      if (entriesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('driver_work_log')
          .delete()
          .in('id', entriesToDelete);

        if (deleteError) throw deleteError;
      }

      // Upsert new/updated entries  
      if (entriesToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('driver_work_log')
          .upsert(entriesToUpsert, { 
            onConflict: 'employee_id,work_date',
            ignoreDuplicates: false
          });

        if (upsertError) throw upsertError;
      }

      // Refresh data
      await fetchWorkLogEntries();
      
      toast({
        title: "Uspjeh",
        description: "Evidencija rada je uspješno sačuvana",
      });
    } catch (error) {
      console.error('Error saving work log:', error);
      toast({
        title: "Greška",
        description: "Neuspješno čuvanje evidencije rada",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedDriverId, monthlyEntries, fetchWorkLogEntries]);

  // Delete specific entry
  const deleteEntry = useCallback(async (entryId: string, date: string) => {
    try {
      const { error } = await supabase
        .from('driver_work_log')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setMonthlyEntries(prev => prev.map(entry => 
        entry.date === date 
          ? { ...entry, hours: null, note: '', hasExistingRecord: false, id: undefined }
          : entry
      ));

      toast({
        title: "Uspjeh",
        description: "Zapis je uspješno obrisan",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Greška",
        description: "Neuspješno brisanje zapisa",
        variant: "destructive",
      });
    }
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!selectedDriverId || selectedDriverId === 'svi' || monthlyEntries.length === 0) return;

    const driverName = drivers.find(d => d.id === selectedDriverId);
    const monthYear = format(selectedMonth, 'MM/yyyy');
    
    const csvContent = [
      [`${driverName?.first_name} ${driverName?.last_name}`, getMonthName(selectedMonth)],
      ['', '', '', ''],
      ['', '', 'RADNI SATI', 'DNEVNICE'],
      ...monthlyEntries.map(entry => [
        format(parseISO(entry.date), 'dd/MM/yyyy'),
        '',
        entry.hours?.toString() || '0',
        entry.note || '0'
      ]),
      ['', '', '', ''],
      ['', '', 'UKUPNO :', totalDnevnice.toString()],
      ['', '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidencija_rada_${driverName?.first_name}_${driverName?.last_name}_${monthYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedDriverId, monthlyEntries, drivers, selectedMonth]);

  // Calculate total hours
  const totalHours = monthlyEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    if (selectedDriverId && selectedDriverId !== 'svi' && selectedMonth) {
      fetchWorkLogEntries();
    } else {
      setMonthlyEntries([]);
    }
  }, [selectedDriverId, selectedMonth, fetchWorkLogEntries]);

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Filter Bar */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-sm sm:text-xl">Evidencija rada vozača</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">Vozač</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="h-10 sm:h-11 shadow-sm text-sm">
                  <SelectValue placeholder="Izaberite vozača" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svi">🚗 Svi vozači</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      👤 {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">Mjesec</Label>
              <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 sm:h-11 w-full justify-start text-left font-normal shadow-sm text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getMonthName(selectedMonth)} {selectedMonth.getFullYear()}
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs sm:text-sm font-semibold">Akcije</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                 <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fillWorkingDays}
                  disabled={!selectedDriverId || selectedDriverId === 'svi'}
                  className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Radni dani
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToCSV}
                  disabled={!selectedDriverId || selectedDriverId === 'svi' || monthlyEntries.length === 0}
                  className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  CSV Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Log Grid */}
      {selectedDriverId && selectedDriverId !== 'svi' && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base sm:text-xl font-semibold">
                    {drivers.find(d => d.id === selectedDriverId)?.first_name?.toUpperCase()} {drivers.find(d => d.id === selectedDriverId)?.last_name?.toUpperCase()}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground font-medium">
                    {getMonthName(selectedMonth)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Badge variant="secondary" className="text-sm sm:text-lg font-semibold w-fit">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Ukupno: {totalHours.toFixed(2)}h
                    </Badge>
                    <Badge variant="outline" className="text-sm sm:text-lg font-semibold w-fit">
                      💰 Dnevnice: {totalDnevnice.toFixed(2)} KM
                    </Badge>
                  </div>
                <Button 
                  onClick={saveAllEntries} 
                  disabled={saving} 
                  className="shadow-sm w-full sm:w-auto text-sm"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1 sm:mr-2" />
                  {saving ? 'Čuvanje...' : 'Sačuvaj sve'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                {loading ? (
                  <div className="text-center py-8 px-4">
                    <div className="text-sm text-muted-foreground">Učitavanje...</div>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {monthlyEntries.map((entry) => {
                      const date = new Date(entry.date);
                      const dayName = format(date, 'EEE');
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <Card key={entry.date} className={`p-3 ${isWeekend ? 'bg-muted/30' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{format(date, 'dd/MM')}</span>
                              <Badge variant={isWeekend ? 'secondary' : 'outline'} className="text-xs">
                                {dayName}
                              </Badge>
                            </div>
                            {entry.hasExistingRecord && entry.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => entry.id && deleteEntry(entry.id, entry.date)}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Sati</Label>
                              <Input
                                type="number"
                                step="0.25"
                                min="0"
                                max="24"
                                value={entry.hours === null ? '' : entry.hours.toString()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateHours(entry.date, null);
                                  } else {
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
                                      updateHours(entry.date, numValue);
                                    }
                                  }
                                }}
                                className="text-sm h-9"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Dnevnice</Label>
                              <Input
                                type="number"
                                value={entry.note}
                                onChange={(e) => updateNote(entry.date, e.target.value)}
                                placeholder="0"
                                className="text-sm h-9"
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-32 font-semibold">Datum</TableHead>
                      <TableHead className="w-32 font-semibold">Dan</TableHead>
                      <TableHead className="w-40 font-semibold">Sati</TableHead>
                      <TableHead className="font-semibold">Dnevnice</TableHead>
                      <TableHead className="w-20 font-semibold">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Učitavanje...
                        </TableCell>
                      </TableRow>
                    ) : monthlyEntries.map((entry) => {
                      const date = new Date(entry.date);
                      const dayName = format(date, 'EEE');
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <TableRow key={entry.date} className={isWeekend ? 'bg-muted/30' : ''}>
                          <TableCell className="font-medium">
                            {format(date, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isWeekend ? 'secondary' : 'outline'}>
                              {dayName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              max="24"
                              value={entry.hours === null ? '' : entry.hours.toString()}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  updateHours(entry.date, null);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
                                    updateHours(entry.date, numValue);
                                  }
                                }
                              }}
                              className="w-32"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.note}
                              onChange={(e) => updateNote(entry.date, e.target.value)}
                              placeholder="0"
                              className="min-w-[300px]"
                            />
                          </TableCell>
                          <TableCell>
                            {entry.hasExistingRecord && entry.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => entry.id && deleteEntry(entry.id, entry.date)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(!selectedDriverId || selectedDriverId === 'svi') && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Nema odabranog vozača</h3>
            <p className="text-muted-foreground text-center">
              Izaberite vozača iz dropdown liste da biste vidjeli evidenciju rada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Total dnevnice display */}
      {selectedDriverId && selectedDriverId !== 'svi' && (() => {
        const driverName = drivers.find(d => d.id === selectedDriverId);
        return (
          <div className="mt-6 p-4 bg-muted rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {driverName?.first_name} {driverName?.last_name} - {getMonthName(selectedMonth)} {selectedMonth.getFullYear()}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">UKUPNO DNEVNICE:</p>
                <p className="text-2xl font-bold">{totalDnevnice} KM</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default WorkLogTab;