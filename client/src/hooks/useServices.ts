import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService } from '@/services/api';
import { Service } from '@/types';

export function useServices() {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: servicesService.getServices,
  });

  const createService = useMutation({
    mutationFn: servicesService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const updateService = useMutation({
    mutationFn: ({ id, ...service }: { id: string } & any) =>
      servicesService.updateService(id, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const deleteService = useMutation({
    mutationFn: servicesService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  return {
    services: servicesQuery.data?.data?.services as Service[] || [],
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    createService,
    updateService,
    deleteService,
  };
}