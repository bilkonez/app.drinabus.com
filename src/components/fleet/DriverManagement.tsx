import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users, Phone, Mail, Calendar } from "lucide-react";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  jmbg: string;
  role: 'vozač' | 'mehaničar' | 'operativa';
  status: 'aktivan' | 'na_odmoru' | 'neaktivan';
  phone: string;
  email: string;
  hireDate: string;
  licenseCategories: string[];
  licenseExpiry: string;
  certificates: string[];
  notes: string;
}

const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      firstName: 'Marko',
      lastName: 'Petrović',
      jmbg: '1234567890123',
      role: 'vozač',
      status: 'aktivan',
      phone: '065/123-456',
      email: 'marko@drinabus.ba',
      hireDate: '2020-03-15',
      licenseCategories: ['D', 'D1'],
      licenseExpiry: '2026-08-20',
      certificates: ['Defenzivna vožnja', 'Prva pomoć'],
      notes: 'Iskusan vozač za daleke relacije'
    },
    {
      id: '2',
      firstName: 'Aleksandar',
      lastName: 'Nikolić',
      jmbg: '9876543210987',
      role: 'vozač',
      status: 'aktivan',
      phone: '065/789-012',
      email: 'aleksandar@drinabus.ba',
      hireDate: '2021-01-10',
      licenseCategories: ['D', 'D1', 'C'],
      licenseExpiry: '2025-12-15',
      certificates: ['Turistički vodič'],
      notes: 'Specijalizovan za turističke ture'
    },
    {
      id: '3',
      firstName: 'Miloš',
      lastName: 'Janković',
      jmbg: '1122334455667',
      role: 'mehaničar',
      status: 'aktivan',
      phone: '065/345-678',
      email: 'milos@drinabus.ba',
      hireDate: '2019-07-22',
      licenseCategories: ['B'],
      licenseExpiry: '2027-03-10',
      certificates: ['Mehaničar autobusa', 'Dijagnostika'],
      notes: 'Glavni mehaničar za održavanje flote'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    firstName: '',
    lastName: '',
    jmbg: '',
    role: 'vozač',
    status: 'aktivan',
    phone: '',
    email: '',
    hireDate: '',
    licenseCategories: [],
    licenseExpiry: '',
    certificates: [],
    notes: ''
  });

  const getStatusBadge = (status: Driver['status']) => {
    const statusMap = {
      aktivan: { label: 'Aktivan', variant: 'default' as const },
      na_odmoru: { label: 'Na odmoru', variant: 'secondary' as const },
      neaktivan: { label: 'Neaktivan', variant: 'destructive' as const }
    };
    return statusMap[status];
  };

  const getRoleBadge = (role: Driver['role']) => {
    const roleMap = {
      vozač: { label: 'Vozač', variant: 'default' as const },
      mehaničar: { label: 'Mehaničar', variant: 'secondary' as const },
      operativa: { label: 'Operativa', variant: 'outline' as const }
    };
    return roleMap[role];
  };

  const handleAddDriver = () => {
    if (newDriver.firstName && newDriver.lastName && newDriver.jmbg) {
      const driver: Driver = {
        id: Date.now().toString(),
        firstName: newDriver.firstName,
        lastName: newDriver.lastName,
        jmbg: newDriver.jmbg,
        role: newDriver.role || 'vozač',
        status: newDriver.status || 'aktivan',
        phone: newDriver.phone || '',
        email: newDriver.email || '',
        hireDate: newDriver.hireDate || new Date().toISOString().split('T')[0],
        licenseCategories: newDriver.licenseCategories || [],
        licenseExpiry: newDriver.licenseExpiry || '',
        certificates: newDriver.certificates || [],
        notes: newDriver.notes || ''
      };
      setDrivers([...drivers, driver]);
      setNewDriver({
        firstName: '',
        lastName: '',
        jmbg: '',
        role: 'vozač',
        status: 'aktivan',
        phone: '',
        email: '',
        hireDate: '',
        licenseCategories: [],
        licenseExpiry: '',
        certificates: [],
        notes: ''
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers(drivers.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Uposlenici</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dodaj Uposlenika
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dodavanje Novog Uposlenika</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ime</Label>
                <Input
                  value={newDriver.firstName}
                  onChange={(e) => setNewDriver({...newDriver, firstName: e.target.value})}
                  placeholder="Ime"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Prezime</Label>
                <Input
                  value={newDriver.lastName}
                  onChange={(e) => setNewDriver({...newDriver, lastName: e.target.value})}
                  placeholder="Prezime"
                />
              </div>
              <div>
                <Label htmlFor="jmbg">JMBG</Label>
                <Input
                  value={newDriver.jmbg}
                  onChange={(e) => setNewDriver({...newDriver, jmbg: e.target.value})}
                  placeholder="1234567890123"
                />
              </div>
              <div>
                <Label htmlFor="role">Uloga</Label>
                <Select value={newDriver.role} onValueChange={(value: any) => setNewDriver({...newDriver, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite ulogu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vozač">Vozač</SelectItem>
                    <SelectItem value="mehaničar">Mehaničar</SelectItem>
                    <SelectItem value="operativa">Operativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                  placeholder="065/123-456"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                  placeholder="ime@drinabus.ba"
                />
              </div>
              <div>
                <Label htmlFor="hireDate">Datum zaposlenja</Label>
                <Input
                  type="date"
                  value={newDriver.hireDate}
                  onChange={(e) => setNewDriver({...newDriver, hireDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">Vozačka do</Label>
                <Input
                  type="date"
                  value={newDriver.licenseExpiry}
                  onChange={(e) => setNewDriver({...newDriver, licenseExpiry: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  value={newDriver.notes}
                  onChange={(e) => setNewDriver({...newDriver, notes: e.target.value})}
                  placeholder="Dodatne informacije o uposleniku..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Otkaži
              </Button>
              <Button onClick={handleAddDriver}>
                Dodaj Uposlenika
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pregled Uposlenika
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ime i prezime</TableHead>
                <TableHead>Uloga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Vozačka ističe</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{driver.firstName} {driver.lastName}</div>
                      <div className="text-sm text-muted-foreground">JMBG: {driver.jmbg}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadge(driver.role).variant}>
                      {getRoleBadge(driver.role).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(driver.status).variant}>
                      {getStatusBadge(driver.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {driver.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(driver.licenseExpiry).toLocaleDateString('bs-BA')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDriver(driver.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverManagement;