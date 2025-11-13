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
import { Plus, Edit, Trash2, CalendarIcon, MapPin, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TourPackage {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  destination: string;
  tour_type: string;
  duration_days: number;
  available_from: string;
  available_to: string | null;
  price: number | null;
  price_note: string | null;
  departure_city: string;
  max_passengers: number | null;
  included_services: string[] | null;
  not_included: string[] | null;
  cover_image_url: string | null;
  featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const TourPackageManagement = () => {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TourPackage | null>(null);
  const [includedServiceInput, setIncludedServiceInput] = useState("");
  const [notIncludedInput, setNotIncludedInput] = useState("");
  const [availableFromDate, setAvailableFromDate] = useState<Date>();
  const [availableToDate, setAvailableToDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    destination: "",
    tour_type: "jednodnevni",
    duration_days: "1",
    available_from: "",
    available_to: "",
    price: "",
    price_note: "",
    departure_city: "Bijeljina",
    max_passengers: "",
    included_services: [] as string[],
    not_included: [] as string[],
    cover_image_url: "",
    featured: false,
    status: "aktivan"
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tour_packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching tour packages:", error);
      toast({
        title: "Greška",
        description: "Nije moguće učitati ponude",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Auto-generate slug when title changes
    if (field === "title") {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const addIncludedService = () => {
    if (includedServiceInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        included_services: [...prev.included_services, includedServiceInput.trim()],
      }));
      setIncludedServiceInput("");
    }
  };

  const removeIncludedService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      included_services: prev.included_services.filter((_, i) => i !== index),
    }));
  };

  const addNotIncluded = () => {
    if (notIncludedInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        not_included: [...prev.not_included, notIncludedInput.trim()],
      }));
      setNotIncludedInput("");
    }
  };

  const removeNotIncluded = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      not_included: prev.not_included.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      short_description: "",
      full_description: "",
      destination: "",
      tour_type: "jednodnevni",
      duration_days: "1",
      available_from: "",
      available_to: "",
      price: "",
      price_note: "",
      departure_city: "Bijeljina",
      max_passengers: "",
      included_services: [],
      not_included: [],
      cover_image_url: "",
      featured: false,
      status: "aktivan"
    });
    setAvailableFromDate(undefined);
    setAvailableToDate(undefined);
    setIncludedServiceInput("");
    setNotIncludedInput("");
    setEditingPackage(null);
  };

  const openEditDialog = (pkg: TourPackage) => {
    setEditingPackage(pkg);
    setFormData({
      title: pkg.title,
      slug: pkg.slug,
      short_description: pkg.short_description,
      full_description: pkg.full_description || "",
      destination: pkg.destination,
      tour_type: pkg.tour_type,
      duration_days: pkg.duration_days.toString(),
      available_from: pkg.available_from,
      available_to: pkg.available_to || "",
      price: pkg.price?.toString() || "",
      price_note: pkg.price_note || "",
      departure_city: pkg.departure_city,
      max_passengers: pkg.max_passengers?.toString() || "",
      included_services: pkg.included_services || [],
      not_included: pkg.not_included || [],
      cover_image_url: pkg.cover_image_url || "",
      featured: pkg.featured,
      status: pkg.status
    });
    setAvailableFromDate(new Date(pkg.available_from));
    if (pkg.available_to) {
      setAvailableToDate(new Date(pkg.available_to));
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.destination || !formData.short_description) {
      toast({
        title: "Greška",
        description: "Molimo popunite sva obavezna polja",
        variant: "destructive",
      });
      return;
    }

    try {
      const packageData = {
        title: formData.title,
        slug: formData.slug,
        short_description: formData.short_description,
        full_description: formData.full_description || null,
        destination: formData.destination,
        tour_type: formData.tour_type,
        duration_days: parseInt(formData.duration_days),
        available_from: availableFromDate ? format(availableFromDate, "yyyy-MM-dd") : formData.available_from,
        available_to: availableToDate ? format(availableToDate, "yyyy-MM-dd") : formData.available_to || null,
        price: formData.price ? parseFloat(formData.price) : null,
        price_note: formData.price_note || null,
        departure_city: formData.departure_city,
        max_passengers: formData.max_passengers ? parseInt(formData.max_passengers) : null,
        included_services: formData.included_services.length > 0 ? formData.included_services : null,
        not_included: formData.not_included.length > 0 ? formData.not_included : null,
        cover_image_url: formData.cover_image_url || null,
        featured: formData.featured,
        status: formData.status
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("tour_packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast({
          title: "Uspešno",
          description: "Ponuda je ažurirana",
        });
      } else {
        const { error } = await supabase
          .from("tour_packages")
          .insert([packageData]);

        if (error) throw error;
        toast({
          title: "Uspešno",
          description: "Nova ponuda je kreirana",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom čuvanja ponude",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovu ponudu?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tour_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Ponuda je obrisana",
      });
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja ponude",
        variant: "destructive",
      });
    }
  };

  const tourTypeLabels: Record<string, string> = {
    jednodnevni: "Jednodnevni izlet",
    vikendzica: "Vičkendica",
    visednevni: "Višednevno putovanje",
    sezonsko: "Sezonska ponuda"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Upravljanje ponudama</CardTitle>
            <CardDescription>Dodajte, editujte ili brišite ponude putovanja</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj ponudu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? "Edituj ponudu" : "Nova ponuda"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Naslov */}
                <div className="col-span-2">
                  <Label htmlFor="title">Naslov *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Zagreb Advent 2024"
                  />
                </div>

                {/* Slug */}
                <div className="col-span-2">
                  <Label htmlFor="slug">URL slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    placeholder="zagreb-advent-2024"
                  />
                </div>

                {/* Destinacija */}
                <div>
                  <Label htmlFor="destination">Destinacija *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => handleInputChange("destination", e.target.value)}
                    placeholder="Zagreb, Hrvatska"
                  />
                </div>

                {/* Tip ture */}
                <div>
                  <Label htmlFor="tour_type">Tip ture *</Label>
                  <Select
                    value={formData.tour_type}
                    onValueChange={(value) => handleInputChange("tour_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jednodnevni">Jednodnevni izlet</SelectItem>
                      <SelectItem value="vikendzica">Vičkendica</SelectItem>
                      <SelectItem value="visednevni">Višednevno putovanje</SelectItem>
                      <SelectItem value="sezonsko">Sezonska ponuda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trajanje */}
                <div>
                  <Label htmlFor="duration_days">Trajanje (dana) *</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => handleInputChange("duration_days", e.target.value)}
                    min="1"
                  />
                </div>

                {/* Mesto polaska */}
                <div>
                  <Label htmlFor="departure_city">Mesto polaska *</Label>
                  <Input
                    id="departure_city"
                    value={formData.departure_city}
                    onChange={(e) => handleInputChange("departure_city", e.target.value)}
                    placeholder="Bijeljina"
                  />
                </div>

                {/* Dostupno od */}
                <div>
                  <Label>Datum polaska *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !availableFromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableFromDate ? format(availableFromDate, "PPP") : "Izaberite datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={availableFromDate}
                        onSelect={setAvailableFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Dostupno do */}
                <div>
                  <Label>Datum završetka (opciono)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !availableToDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableToDate ? format(availableToDate, "PPP") : "Izaberite datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={availableToDate}
                        onSelect={setAvailableToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Cena */}
                <div>
                  <Label htmlFor="price">Cena (KM)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="150"
                  />
                </div>

                {/* Napomena o ceni */}
                <div>
                  <Label htmlFor="price_note">Napomena o ceni</Label>
                  <Input
                    id="price_note"
                    value={formData.price_note}
                    onChange={(e) => handleInputChange("price_note", e.target.value)}
                    placeholder="po osobi"
                  />
                </div>

                {/* Maksimalan broj putnika */}
                <div>
                  <Label htmlFor="max_passengers">Maks. broj putnika</Label>
                  <Input
                    id="max_passengers"
                    type="number"
                    value={formData.max_passengers}
                    onChange={(e) => handleInputChange("max_passengers", e.target.value)}
                    placeholder="50"
                  />
                </div>

                {/* Cover slika URL */}
                <div className="col-span-2">
                  <Label htmlFor="cover_image_url">URL cover slike</Label>
                  <Input
                    id="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={(e) => handleInputChange("cover_image_url", e.target.value)}
                    placeholder="/lovable-uploads/image.jpg"
                  />
                </div>

                {/* Kratak opis */}
                <div className="col-span-2">
                  <Label htmlFor="short_description">Kratak opis *</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => handleInputChange("short_description", e.target.value)}
                    placeholder="Uživajte u čarima zimskog Zagreba..."
                    rows={3}
                  />
                </div>

                {/* Pun opis */}
                <div className="col-span-2">
                  <Label htmlFor="full_description">Pun opis</Label>
                  <Textarea
                    id="full_description"
                    value={formData.full_description}
                    onChange={(e) => handleInputChange("full_description", e.target.value)}
                    placeholder="Detaljan opis ponude..."
                    rows={6}
                  />
                </div>

                {/* Uključene usluge */}
                <div className="col-span-2">
                  <Label>Uključene usluge</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={includedServiceInput}
                      onChange={(e) => setIncludedServiceInput(e.target.value)}
                      placeholder="Prevoz autobusom"
                      onKeyPress={(e) => e.key === "Enter" && addIncludedService()}
                    />
                    <Button type="button" onClick={addIncludedService}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.included_services.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                        <button
                          onClick={() => removeIncludedService(index)}
                          className="ml-2"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Nije uključeno */}
                <div className="col-span-2">
                  <Label>Nije uključeno</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={notIncludedInput}
                      onChange={(e) => setNotIncludedInput(e.target.value)}
                      placeholder="Ličan trošak"
                      onKeyPress={(e) => e.key === "Enter" && addNotIncluded()}
                    />
                    <Button type="button" onClick={addNotIncluded}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.not_included.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item}
                        <button
                          onClick={() => removeNotIncluded(index)}
                          className="ml-2"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktivan">Aktivan</SelectItem>
                      <SelectItem value="neaktivan">Neaktivan</SelectItem>
                      <SelectItem value="nacrt">Nacrt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Featured */}
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange("featured", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Istaknuta ponuda
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Otkaži
                </Button>
                <Button onClick={handleSubmit}>
                  {editingPackage ? "Sačuvaj izmene" : "Kreiraj ponudu"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Učitavanje...</div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nema kreiranih ponuda. Kliknite na "Dodaj ponudu" da kreirate prvu ponudu.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naslov</TableHead>
                <TableHead>Destinacija</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-medium">{pkg.title}</div>
                    {pkg.featured && (
                      <Badge variant="secondary" className="mt-1">Istaknuto</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {pkg.destination}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tourTypeLabels[pkg.tour_type]}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(pkg.available_from), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell>
                    {pkg.price ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {pkg.price} KM
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        pkg.status === "aktivan"
                          ? "default"
                          : pkg.status === "neaktivan"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(pkg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TourPackageManagement;
