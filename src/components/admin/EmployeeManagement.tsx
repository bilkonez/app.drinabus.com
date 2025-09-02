import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Filter, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import WorkLogTab from './WorkLogTab';

// Define available roles
const AVAILABLE_ROLES = [
  { id: 'vozac', label: 'Vozač' },
  { id: 'mehanicar', label: 'Mehaničar' },
  { id: 'operativa', label: 'Operativa' },
  { id: 'ostalo', label: 'Ostalo' }
] as const;

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  license_expiry?: string;
  tachograph_card_expiry?: string;
  notes?: string;
  active: boolean;
  role?: string; // Legacy field
  roles_array?: string[];
  roles_csv?: string;
  is_vozac?: boolean;
  is_mehanicar?: boolean;
  is_operativa?: boolean;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('svi');
  const [activeFilter, setActiveFilter] = useState<string>('svi');
  const [licenseExpiry, setLicenseExpiry] = useState<Date | undefined>();
  const [tachographExpiry, setTachographExpiry] = useState<Date | undefined>();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('v_employees_with_roles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Greška",
        description: "Neuspješno učitavanje uposlenika",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const employeeData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      license_expiry: licenseExpiry ? format(licenseExpiry, 'yyyy-MM-dd') : null,
      tachograph_card_expiry: tachographExpiry ? format(tachographExpiry, 'yyyy-MM-dd') : null,
      notes: formData.get('notes') as string || null,
      active: formData.get('active') === 'true',
    };

    try {
      let employeeId: string;

      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        employeeId = editingEmployee.id;
      } else {
        // Create new employee
        const { data, error } = await supabase
          .from('employees')
          .insert([employeeData])
          .select()
          .single();

        if (error) throw error;
        employeeId = data.id;
      }

      // Update roles - delete existing and insert new ones
      if (selectedRoles.length > 0) {
        // Delete existing roles
        await supabase
          .from('employee_roles')
          .delete()
          .eq('employee_id', employeeId);

        // Insert new roles
        const roleInserts = selectedRoles.map(roleId => ({
          employee_id: employeeId,
          role_id: roleId
        }));

        const { error: rolesError } = await supabase
          .from('employee_roles')
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      toast({
        title: "Uspjeh",
        description: editingEmployee ? "Uposlenik je uspješno ažuriran" : "Uposlenik je uspješno kreiran",
      });

      setShowDialog(false);
      setEditingEmployee(null);
      setSelectedRoles([]);
      setLicenseExpiry(undefined);
      setTachographExpiry(undefined);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Greška",
        description: "Neuspješno snimanje uposlenika",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovog uposlenika?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Uspjeh",
        description: "Uposlenik je uspješno obrisan",
      });

      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Greška",
        description: "Neuspješno brisanje uposlenika",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (employee: Employee) => {
    setEditingEmployee(employee);
    // Load current roles for this employee
    setSelectedRoles(employee.roles_array || []);
    setLicenseExpiry(employee.license_expiry ? new Date(employee.license_expiry) : undefined);
    setTachographExpiry(employee.tachograph_card_expiry ? new Date(employee.tachograph_card_expiry) : undefined);
    setShowDialog(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setSelectedRoles([]);
    setLicenseExpiry(undefined);
    setTachographExpiry(undefined);
    setShowDialog(true);
  };

  // Filter employees based on role and active status
  const filteredEmployees = employees.filter(emp => {
    const matchesActive = activeFilter === 'svi' || 
      (activeFilter === 'aktivni' && emp.active) || 
      (activeFilter === 'neaktivni' && !emp.active);
    
    const matchesRole = roleFilter === 'svi' || 
      (emp.roles_array && emp.roles_array.includes(roleFilter));
    
    return matchesActive && matchesRole;
  });

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const getRoleBadge = (roleId: string) => {
    const roleConfig = {
      vozac: { variant: "default" as const, label: "Vozač" },
      mehanicar: { variant: "secondary" as const, label: "Mehaničar" },
      operativa: { variant: "outline" as const, label: "Operativa" },
      ostalo: { variant: "outline" as const, label: "Ostalo" },
    };
    return roleConfig[roleId as keyof typeof roleConfig] || { variant: "outline" as const, label: roleId };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Uposlenici</h2>
          <p className="text-muted-foreground">
            Upravljanje uposlenicima i vozačima
          </p>
        </div>
        
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj uposlenika
        </Button>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista uposlenika
          </TabsTrigger>
          <TabsTrigger value="worklog" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Evidencija rada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="svi">Svi</SelectItem>
                      <SelectItem value="aktivni">Aktivni</SelectItem>
                      <SelectItem value="neaktivni">Neaktivni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Uloga</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="svi">Sve uloge</SelectItem>
                      {AVAILABLE_ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista uposlenika</CardTitle>
              <CardDescription>
                {filteredEmployees.length} od {employees.length} uposlenika
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Učitavanje uposlenika...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ime i prezime</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Uloge</TableHead>
                        <TableHead>Vozačka dozvola</TableHead>
                        <TableHead>Tahograf kartica</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {employee.phone && <div>{employee.phone}</div>}
                              {employee.email && <div className="text-muted-foreground">{employee.email}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {employee.roles_array && employee.roles_array.length > 0 ? (
                                employee.roles_array.map(roleId => {
                                  const roleInfo = getRoleBadge(roleId);
                                  return (
                                    <Badge key={roleId} variant={roleInfo.variant} className="text-xs">
                                      {roleInfo.label}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-muted-foreground text-sm">Nema uloge</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.license_expiry ? (
                              <div className="text-sm">
                                {format(new Date(employee.license_expiry), 'dd/MM/yyyy')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {employee.tachograph_card_expiry ? (
                              <div className="text-sm">
                                {format(new Date(employee.tachograph_card_expiry), 'dd/MM/yyyy')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.active ? "default" : "secondary"}>
                              {employee.active ? "Aktivan" : "Neaktivan"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(employee.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worklog">
          <WorkLogTab />
        </TabsContent>
      </Tabs>

      {/* Dialog for Add/Edit Employee */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Uredi uposlenika" : "Dodaj novog uposlenika"}
            </DialogTitle>
            <DialogDescription>
              Unesite podatke o uposleniku i dodijelite mu uloge.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ime *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={editingEmployee?.first_name || ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Prezime *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={editingEmployee?.last_name || ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingEmployee?.phone || ''}
                  placeholder="+387 XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingEmployee?.email || ''}
                  placeholder="ime@drinabus.ba"
                />
              </div>
            </div>

            {/* Multi-select Roles */}
            <div className="space-y-2">
              <Label>Uloge</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {AVAILABLE_ROLES.map(role => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    />
                    <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Istek vozačke dozvole</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {licenseExpiry ? format(licenseExpiry, "dd/MM/yyyy") : "Odaberite datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={licenseExpiry}
                      onSelect={setLicenseExpiry}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Istek tahograf kartice</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tachographExpiry ? format(tachographExpiry, "dd/MM/yyyy") : "Odaberite datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tachographExpiry}
                      onSelect={setTachographExpiry}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Napomene</Label>
              <Input
                id="notes"
                name="notes"
                defaultValue={editingEmployee?.notes || ''}
                placeholder="Dodatne napomene..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                name="active"
                value="true"
                defaultChecked={editingEmployee?.active !== false}
              />
              <Label htmlFor="active">Aktivan</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Otkaži
              </Button>
              <Button type="submit">
                {editingEmployee ? "Ažuriraj" : "Kreiraj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;