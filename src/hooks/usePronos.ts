import { useQuery } from '@tanstack/react-query';
import { pronosService } from '@/lib/api';

export const usePronos = (date?: string) => {
  return useQuery({
    queryKey: ['pronos', date],
    queryFn: async () => {
      const response: any = await pronosService.getPronos(date);
      return response.data;
    },
  });
};

export const useProno = (id: string) => {
  return useQuery({
    queryKey: ['prono', id],
    queryFn: async () => {
      const response: any = await pronosService.getPronoById(id);
      return response.data;
    },
  });
};
