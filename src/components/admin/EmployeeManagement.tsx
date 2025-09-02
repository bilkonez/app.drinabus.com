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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  role: string;
  license_expiry: string | null;
  tachograph_card_expiry: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "vozac",
    license_expiry: "",
    tachograph_card_expiry: "",
    active: true,
    notes: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom učitavanja uposlenika",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        email: formData.email || null,
        role: formData.role,
        license_expiry: formData.license_expiry || null,
        tachograph_card_expiry: formData.tachograph_card_expiry || null,
        active: formData.active,
        notes: formData.notes || null,
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Uposlenik je uspješno ažuriran",
        });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert(employeeData);

        if (error) throw error;

        toast({
          title: "Uspjeh",
          description: "Uposlenik je uspješno dodan",
        });
      }

      setDialogOpen(false);
      resetForm();
      await fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom čuvanja uposlenika",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom brisanja uposlenika",
        variant: "destructive",
      });
    }
  };

  const openDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        phone: employee.phone || "",
        email: employee.email || "",
        role: employee.role,
        license_expiry: employee.license_expiry || "",
        tachograph_card_expiry: employee.tachograph_card_expiry || "",
        active: employee.active,
        notes: employee.notes || "",
      });
    } else {
      setEditingEmployee(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      role: "vozac",
      license_expiry: "",
      tachograph_card_expiry: "",
      active: true,
      notes: "",
    });
    setEditingEmployee(null);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      vozac: { variant: "default" as const, label: "Vozač" },
      mehanicar: { variant: "secondary" as const, label: "Mehaničar" },
      operativa: { variant: "outline" as const, label: "Operativa" },
      ostalo: { variant: "outline" as const, label: "Ostalo" },
    };
    return variants[role as keyof typeof variants] || { variant: "outline" as const, label: role };
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
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj uposlenika
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Uredi uposlenika" : "Dodaj novog uposlenika"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ime *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Prezime *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+387 XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ime@drinabus.ba"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Uloga</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vozac">Vozač</SelectItem>
                    <SelectItem value="mehanicar">Mehaničar</SelectItem>
                    <SelectItem value="operativa">Operativa</SelectItem>
                    <SelectItem value="ostalo">Ostalo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_expiry">Istek vozačke dozvole</Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tachograph_card_expiry">Istek tahograf kartice</Label>
                <Input
                  id="tachograph_card_expiry"
                  type="date"
                  value={formData.tachograph_card_expiry}
                  onChange={(e) => setFormData({...formData, tachograph_card_expiry: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="active" 
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked as boolean})}
                />
                <Label htmlFor="active">Aktivan</Label>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista uposlenika
          </CardTitle>
          <CardDescription>
            {employees.length} uposlenika u sistemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Učitavanje uposlenika...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema uposlenika u bazi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ime i prezime</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Uloga</TableHead>
                    <TableHead>Vozačka dozvola</TableHead>
                    <TableHead>Tahograf kartica</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const roleInfo = getRoleBadge(employee.role);
                    return (
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
                          <Badge variant={roleInfo.variant}>
                            {roleInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.license_expiry ? (
                            <div className="text-sm">
                              {new Date(employee.license_expiry).toLocaleDateString('bs-BA')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.tachograph_card_expiry ? (
                            <div className="text-sm">
                              {new Date(employee.tachograph_card_expiry).toLocaleDateString('bs-BA')}
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
                              onClick={() => openDialog(employee)}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;