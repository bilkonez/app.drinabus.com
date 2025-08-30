import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Download,
  Calendar,
  Bus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DailyStats {
  day: string;
  rides_count: number;
  revenue_total: number;
  costs_total: number;
  profit_total: number;
}

interface MonthlyStats {
  month: string;
  rides_count: number;
  revenue_total: number;
  costs_total: number;
  profit_total: number;
}

interface VehicleCosts {
  vehicle_id: string;
  registration: string;
  month: string;
  costs_total: number;
}

interface Insight {
  kind: string;
  message: string;
  generated_at: string;
}

const ReportsTab = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCosts[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDailyStats(),
        fetchMonthlyStats(),
        fetchVehicleCosts(),
        fetchInsights()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Greška",
        description: "Greška prilikom učitavanja podataka",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    const { data, error } = await supabase
      .from('v_daily_stats')
      .select('*')
      .order('day', { ascending: false })
      .limit(30);

    if (error) throw error;
    setDailyStats(data || []);
  };

  const fetchMonthlyStats = async () => {
    const { data, error } = await supabase
      .from('v_monthly_stats')
      .select('*')
      .order('month', { ascending: false })
      .limit(12);

    if (error) throw error;
    setMonthlyStats(data || []);
  };

  const fetchVehicleCosts = async () => {
    const { data, error } = await supabase
      .from('v_vehicle_monthly_costs')
      .select('*')
      .order('month', { ascending: false })
      .limit(50);

    if (error) throw error;
    setVehicleCosts(data || []);
  };

  const fetchInsights = async () => {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setInsights(data || []);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "0,00 KM";
    return `${amount.toFixed(2).replace('.', ',')} KM`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA');
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast({
        title: "Greška",
        description: "Nema podataka za izvoz",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const todayStats = dailyStats.find(stat => 
    new Date(stat.day).toDateString() === new Date().toDateString()
  );

  const currentMonthStats = monthlyStats[0];
  const previousMonthStats = monthlyStats[1];

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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Vožnje danas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayStats?.rides_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">zakazano/završeno</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prihod danas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todayStats?.revenue_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">ukupno</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mjesečni prihod
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthStats?.revenue_total || 0)}
            </div>
            {previousMonthStats && (
              <div className="flex items-center gap-1 text-xs">
                {currentMonthStats?.revenue_total > previousMonthStats.revenue_total ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className="text-muted-foreground">vs prošli mjesec</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Profit mjesečno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthStats?.profit_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">prihod - troškovi</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Dnevni izvještaji</TabsTrigger>
          <TabsTrigger value="monthly">Mjesečni izvještaji</TabsTrigger>
          <TabsTrigger value="vehicles">Troškovi vozila</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Dnevni pregled (zadnjih 30 dana)</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCSV(dailyStats, 'dnevni_izvjestaj')}
            >
              <Download className="h-4 w-4 mr-2" />
              Izvezi CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Broj vožnji</TableHead>
                      <TableHead>Prihod</TableHead>
                      <TableHead>Troškovi</TableHead>
                      <TableHead>Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((stat) => (
                      <TableRow key={stat.day}>
                        <TableCell className="font-medium">
                          {formatDate(stat.day)}
                        </TableCell>
                        <TableCell>{stat.rides_count}</TableCell>
                        <TableCell>{formatCurrency(stat.revenue_total)}</TableCell>
                        <TableCell>{formatCurrency(stat.costs_total)}</TableCell>
                        <TableCell>
                          <Badge variant={stat.profit_total >= 0 ? "default" : "destructive"}>
                            {formatCurrency(stat.profit_total)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mjesečni pregled (zadnjih 12 mjeseci)</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCSV(monthlyStats, 'mjesecni_izvjestaj')}
            >
              <Download className="h-4 w-4 mr-2" />
              Izvezi CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mjesec</TableHead>
                      <TableHead>Broj vožnji</TableHead>
                      <TableHead>Prihod</TableHead>
                      <TableHead>Troškovi</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Profit %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((stat) => {
                      const profitMargin = stat.revenue_total ? 
                        ((stat.profit_total / stat.revenue_total) * 100) : 0;
                      
                      return (
                        <TableRow key={stat.month}>
                          <TableCell className="font-medium">{stat.month}</TableCell>
                          <TableCell>{stat.rides_count}</TableCell>
                          <TableCell>{formatCurrency(stat.revenue_total)}</TableCell>
                          <TableCell>{formatCurrency(stat.costs_total)}</TableCell>
                          <TableCell>
                            <Badge variant={stat.profit_total >= 0 ? "default" : "destructive"}>
                              {formatCurrency(stat.profit_total)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={profitMargin >= 0 ? "default" : "destructive"}>
                              {profitMargin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Troškovi po vozilima</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCSV(vehicleCosts, 'troskovi_vozila')}
            >
              <Download className="h-4 w-4 mr-2" />
              Izvezi CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registracija</TableHead>
                      <TableHead>Mjesec</TableHead>
                      <TableHead>Ukupni troškovi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleCosts.map((cost, index) => (
                      <TableRow key={`${cost.vehicle_id}-${cost.month}-${index}`}>
                        <TableCell className="font-medium">{cost.registration}</TableCell>
                        <TableCell>{cost.month}</TableCell>
                        <TableCell>{formatCurrency(cost.costs_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Insights & analiza</h3>
            <p className="text-sm text-muted-foreground">
              Automatski generirani insights
            </p>
          </div>
          
          <div className="grid gap-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {insight.kind.replace(/_/g, ' ').toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(insight.generated_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{insight.message}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Nema dostupnih insights. Insights se generiraju automatski na dnevnoj bazi.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsTab;