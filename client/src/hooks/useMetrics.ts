import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/services/api';

export function useDashboardMetrics() {
  const result = useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => metricsService.getDashboard(),
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes avant de considérer comme obsolète
    cacheTime: 10 * 60 * 1000, // 10 minutes en cache
  });
  
  return result;
}

export function useContactMetrics(contactId: string) {
  return useQuery({
    queryKey: ['metrics', 'contact', contactId],
    queryFn: () => metricsService.getContactMetrics(contactId),
    enabled: !!contactId,
  });
}