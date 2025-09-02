import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Car, FileDown, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DailyStat {
  day: string;
  rides_count: number;
  revenue_total: number;
  costs_total: number;
  profit_total: number;
}

interface MonthlyStat {
  month: string;
  rides_count: number;
  revenue_total: number;
  costs_total: number;
  profit_total: number;
}

interface VehicleMonthlyCost {
  vehicle_id: string;
  registration: string;
  month: string;
  costs_total: number;
}

interface Insight {
  id: string;
  kind: string;
  message: string;
  generated_at: string;
}

const ReportsTab = () => {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleMonthlyCost[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyRes, monthlyRes, vehicleRes, insightsRes, vehiclesRes] = await Promise.all([
        supabase.from('v_daily_stats').select('*').order('day', { ascending: false }).limit(30),
        supabase.from('v_monthly_stats').select('*').order('month', { ascending: false }).limit(12),
        supabase.from('v_vehicle_monthly_costs').select('*').order('month', { ascending: false }),
        supabase.from('insights').select('*').order('generated_at', { ascending: false }).limit(10),
        supabase.from('vehicles').select('id, registration, brand, model').order('registration')
      ]);

      if (dailyRes.error) throw dailyRes.error;
      if (monthlyRes.error) throw monthlyRes.error;
      if (vehicleRes.error) throw vehicleRes.error;
      if (insightsRes.error) throw insightsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      setDailyStats(dailyRes.data || []);
      setMonthlyStats(monthlyRes.data || []);
      setVehicleCosts(vehicleRes.data || []);
      setInsights(insightsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Greška",
        description: "Greška pri učitavanju izvještaja",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      const { error } = await supabase.rpc('gen_daily_insights');
      if (error) throw error;
      
      toast({
        title: "Uspjeh",
        description: "Insights su uspješno generirani",
      });
      
      fetchData(); // Refresh data after generating insights
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Greška",
        description: "Greška pri generiranju insights",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvData = dailyStats.map(stat => ({
      Datum: formatDate(stat.day),
      'Broj vožnji': stat.rides_count,
      'Prihodi (KM)': stat.revenue_total.toFixed(2),
      'Troškovi (KM)': stat.costs_total.toFixed(2),
      'Profit (KM)': stat.profit_total.toFixed(2)
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drina-bus-izvjestaj-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Uspjeh",
      description: "Izvještaj je uspješno izvezen",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} KM`;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return dailyStats.find(stat => stat.day === today) || {
      rides_count: 0,
      revenue_total: 0,
      costs_total: 0,
      profit_total: 0
    };
  };

  const filteredVehicleCosts = selectedVehicle === "all" 
    ? vehicleCosts 
    : vehicleCosts.filter(cost => cost.vehicle_id === selectedVehicle);

  const todayStats = getTodayStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Učitavanje izvještaja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Izvještaji & analitika</h2>
          <p className="text-muted-foreground">
            Pregled performansi i ključnih pokazatelja
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateInsights} variant="outline">
            <Lightbulb className="w-4 h-4 mr-2" />
            Generiši insights
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Današnji KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Današnje vožnje
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.rides_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Današnji prihod
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.revenue_total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Današnji troškovi
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.costs_total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Današnji profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={todayStats.profit_total >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(todayStats.profit_total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Zanimljive činjenice
            </CardTitle>
            <CardDescription>
              Automatski generirani uvidi iz poslovnih podataka
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="text-sm">{insight.message}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(insight.generated_at)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grafovi */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dnevne statistike */}
        <Card>
          <CardHeader>
            <CardTitle>Dnevne statistike (30 dana)</CardTitle>
            <CardDescription>
              Profit, prihodi i troškovi po danima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(value) => formatDate(value as string)}
                />
                <Line type="monotone" dataKey="revenue_total" stroke="#10b981" name="Prihodi" />
                <Line type="monotone" dataKey="costs_total" stroke="#ef4444" name="Troškovi" />
                <Line type="monotone" dataKey="profit_total" stroke="#3b82f6" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mjesečne statistike */}
        <Card>
          <CardHeader>
            <CardTitle>Mjesečne statistike</CardTitle>
            <CardDescription>
              Ukupni rezultati po mjesecima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue_total" fill="#10b981" name="Prihodi" />
                <Bar dataKey="costs_total" fill="#ef4444" name="Troškovi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Troškovi po vozilu */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Troškovi po vozilu (mjesečno)</CardTitle>
              <CardDescription>
                Pregled troškova po vozilima kroz mjesece
              </CardDescription>
            </div>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Sva vozila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sva vozila</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vozilo</TableHead>
                <TableHead>Mjesec</TableHead>
                <TableHead>Ukupni troškovi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicleCosts.map((cost, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {cost.registration}
                  </TableCell>
                  <TableCell>{cost.month}</TableCell>
                  <TableCell>{formatCurrency(cost.costs_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;