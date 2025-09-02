import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseSupabaseOptions {
  table: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSupabase = ({ table, onSuccess, onError }: UseSupabaseOptions) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = useCallback(async (query?: any) => {
    setLoading(true);
    try {
      let queryBuilder = (supabase as any).from(table).select('*');
      
      if (query) {
        queryBuilder = query(queryBuilder);
      }
      
      const { data: result, error } = await queryBuilder;
      
      if (error) throw error;
      
      setData(result || []);
      onSuccess?.();
      return result;
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Neočekivana greška';
      toast({
        title: "Greška",
        description: `Greška prilikom učitavanja: ${errorMessage}`,
        variant: "destructive",
      });
      onError?.(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table, onSuccess, onError]);

  const createRecord = useCallback(async (record: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Uspjeh",
        description: "Uspješno dodano",
      });
      
      onSuccess?.();
      return result;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Neočekivana greška';
      toast({
        title: "Greška",
        description: `Greška prilikom dodavanja: ${errorMessage}`,
        variant: "destructive",
      });
      onError?.(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table, onSuccess, onError]);

  const updateRecord = useCallback(async (id: string, updates: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Uspjeh",
        description: "Uspješno ažurirano",
      });
      
      onSuccess?.();
      return result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Neočekivana greška';
      toast({
        title: "Greška",
        description: `Greška prilikom ažuriranja: ${errorMessage}`,
        variant: "destructive",
      });
      onError?.(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table, onSuccess, onError]);

  const deleteRecord = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Uspjeh",
        description: "Uspješno obrisano",
      });
      
      onSuccess?.();
      return true;
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Neočekivana greška';
      toast({
        title: "Greška",
        description: `Greška prilikom brisanja: ${errorMessage}`,
        variant: "destructive",
      });
      onError?.(error as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [table, onSuccess, onError]);

  return {
    data,
    loading,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord,
  };
};