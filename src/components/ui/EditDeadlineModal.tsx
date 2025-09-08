import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  kind: string;
  currentDate: string;
  onRefetch: () => void;
}

const mapKindToColumn = (kind: string): string => {
  const mapping: Record<string, string> = {
    'Registracija': 'registration_expiry',
    'Tehnički': 'technical_expiry',
    '6-mj Tehnički': 'technical_6m_expiry',
    'Baždarenje tahografa': 'tachograph_calibration_expiry',
    'PP aparat': 'fire_extinguisher_expiry'
  };
  return mapping[kind] || '';
};

export const EditDeadlineModal = ({
  isOpen,
  onClose,
  vehicleId,
  kind,
  currentDate,
  onRefetch
}: EditDeadlineModalProps) => {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && currentDate) {
      setNewDate(currentDate);
    }
  }, [isOpen, currentDate]);

  const handleSave = async () => {
    if (!newDate || !vehicleId || !kind) return;

    setLoading(true);
    try {
      const field = mapKindToColumn(kind);
      if (!field) {
        toast({
          title: "Greška",
          description: "Nepoznat tip roka.",
          variant: "destructive",
        });
        return;
      }

      // First, get the vehicle deadline record
      const { data: vd, error: e1 } = await supabase
        .from('vehicle_deadlines')
        .select('id, registration_expiry, technical_expiry, technical_6m_expiry, tachograph_calibration_expiry, fire_extinguisher_expiry')
        .eq('vehicle_id', vehicleId)
        .single();

      if (e1 || !vd) {
        toast({
          title: "Greška",
          description: "Greška pri čitanju roka.",
          variant: "destructive",
        });
        return;
      }

      // Update the specific field
      const { error: e2 } = await supabase
        .from('vehicle_deadlines')
        .update({ [field]: newDate })
        .eq('id', vd.id);

      if (e2) {
        toast({
          title: "Greška",
          description: "Greška pri ažuriranju roka.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Uspjeh",
        description: "Rok ažuriran.",
      });

      onRefetch();
      onClose();
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast({
        title: "Greška",
        description: "Neočekivana greška pri ažuriranju roka.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Uredi rok</DialogTitle>
          <DialogDescription>
            Ažuriranje roka za: {kind}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadline-date" className="text-right">
              Novi datum
            </Label>
            <Input
              id="deadline-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Otkaži
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !newDate}
          >
            {loading ? 'Snimam...' : 'Snimi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};