import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/dateUtils';

interface Vehicle {
  id: string;
  registration: string;
}

interface Ride {
  id: string;
  origin: string;
  destination: string;
  start_at: string;
}

interface AddCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COST_TYPES = [
  'gorivo',
  'servis',
  'popravka',
  'registracija',
  'osiguranje',
  'putarina',
  'parking',
  'kazna',
  'ostalo'
];

export const AddCostModal: React.FC<AddCostModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cost_type: '',
    amount: '',
    vehicle_id: '',
    ride_id: '',
    note: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchVehicles();
      fetchRecentRides();
    }
  }, [open]);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, registration')
      .eq('status', 'dostupno')
      .order('registration');

    if (error) {
      console.error('Error fetching vehicles:', error);
      return;
    }

    setVehicles(data || []);
  };

  const fetchRecentRides = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select('id, origin, destination, start_at')
      .order('start_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching rides:', error);
      return;
    }

    setRides(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cost_type || !formData.amount) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite tip troška i iznos.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.vehicle_id && !formData.ride_id) {
      toast({
        title: 'Greška',
        description: 'Molimo odaberite vozilo ili vožnju.',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Greška',
        description: 'Iznos mora biti pozitivan broj.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('costs')
        .insert([{
          cost_type: formData.cost_type,
          amount: amount,
          vehicle_id: formData.vehicle_id || null,
          ride_id: formData.ride_id || null,
          note: formData.note || null
        }]);

      if (error) throw error;

      toast({
        title: 'Uspjeh',
        description: 'Trošak je uspješno dodan.',
      });

      setFormData({
        cost_type: '',
        amount: '',
        vehicle_id: '',
        ride_id: '',
        note: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding cost:', error);
      toast({
        title: 'Greška',
        description: 'Došlo je do greške prilikom dodavanja troška.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      cost_type: '',
      amount: '',
      vehicle_id: '',
      ride_id: '',
      note: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj trošak</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_type">Tip troška *</Label>
              <Select 
                value={formData.cost_type} 
                onValueChange={(value) => setFormData({ ...formData, cost_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite tip" />
                </SelectTrigger>
                <SelectContent>
                  {COST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Iznos (KM) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vozilo</Label>
            <Select 
              value={formData.vehicle_id} 
              onValueChange={(value) => setFormData({ ...formData, vehicle_id: value, ride_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite vozilo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ride_id">Ili odaberite vožnju</Label>
            <Select 
              value={formData.ride_id} 
              onValueChange={(value) => setFormData({ ...formData, ride_id: value, vehicle_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite vožnju" />
              </SelectTrigger>
              <SelectContent>
                {rides.map((ride) => (
                  <SelectItem key={ride.id} value={ride.id}>
                    {ride.origin} → {ride.destination} ({formatDate(ride.start_at)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Napomena</Label>
            <Textarea
              id="note"
              placeholder="Dodatne informacije..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={loading}
            >
              Resetuj
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Dodavanje...' : 'Dodaj trošak'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};