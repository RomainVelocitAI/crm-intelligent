import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService, ContactRequest } from '@/services/api';
import { Contact } from '@/types';

export function useContacts() {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getContacts,
  });

  const createContact = useMutation({
    mutationFn: contactsService.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateContact = useMutation({
    mutationFn: ({ id, ...contact }: { id: string } & ContactRequest) =>
      contactsService.updateContact(id, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const deleteContact = useMutation({
    mutationFn: contactsService.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: contactsQuery.data?.data?.contacts as Contact[] || [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
  };
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsService.getContact(id),
    enabled: !!id,
  });
}