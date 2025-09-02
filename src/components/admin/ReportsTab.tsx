import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ReportsTab = () => {
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Izvještaji
          </CardTitle>
          <CardDescription>
            Funkcionalnost u razvoju
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ovdje će biti prikazani izvještaji i analitika poslovanja.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;