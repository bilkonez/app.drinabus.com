import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

const MaintenanceManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Održavanje & rokovi</h2>
          <p className="text-muted-foreground">
            Upravljanje rokovima i servisima vozila
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Održavanje vozila
          </CardTitle>
          <CardDescription>
            Funkcionalnost u razvoju
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ovdje će biti prikazane funkcionalnosti za upravljanje održavanjem vozila.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceManagement;