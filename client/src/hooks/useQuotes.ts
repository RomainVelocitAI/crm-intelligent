import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesService, QuoteRequest } from '@/services/api';
import { Quote } from '@/types';

export function useQuotes() {
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['quotes'],
    queryFn: quotesService.getQuotes,
  });

  const createQuote = useMutation({
    mutationFn: quotesService.createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateQuote = useMutation({
    mutationFn: ({ id, ...quote }: { id: string } & QuoteRequest) =>
      quotesService.updateQuote(id, quote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: quotesService.deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const sendQuote = useMutation({
    mutationFn: quotesService.sendQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const duplicateQuote = useMutation({
    mutationFn: quotesService.duplicateQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  return {
    quotes: quotesQuery.data?.data?.quotes as Quote[] || [],
    isLoading: quotesQuery.isLoading,
    error: quotesQuery.error,
    createQuote,
    updateQuote,
    deleteQuote,
    sendQuote,
    duplicateQuote,
  };
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesService.getQuote(id),
    enabled: !!id,
  });
}