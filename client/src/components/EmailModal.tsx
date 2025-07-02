import { X, Send, Eye as EyeIcon } from 'lucide-react';
import { Contact, UnifiedEmail } from '@/types';
import EmailTrackingInfo from './EmailTrackingInfo';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  emailSubject: string;
  setEmailSubject: (subject: string) => void;
  emailContent: string;
  setEmailContent: (content: string) => void;
  onSendEmail: () => void;
  isLoadingEmail: boolean;
  contactEmails: UnifiedEmail[];
  isLoadingEmails: boolean;
}

export default function EmailModal({
  isOpen,
  onClose,
  contact,
  emailSubject,
  setEmailSubject,
  emailContent,
  setEmailContent,
  onSendEmail,
  isLoadingEmail,
  contactEmails,
  isLoadingEmails
}: EmailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {(contact.prenom || 'N').charAt(0)}{(contact.nom || 'N').charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Envoyer un email</h3>
              <p className="text-sm text-gray-600">{contact.prenom} {contact.nom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Formulaire d'email */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinataire
              </label>
              <input
                type="email"
                value={contact.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sujet
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Objet de l'email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Votre message..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <EyeIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Email avec tracking activé</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Vous serez notifié lors de l'ouverture de cet email
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onSendEmail}
                disabled={isLoadingEmail || !emailSubject || !emailContent}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isLoadingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panneau de tracking */}
          <div className="w-1/2 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Historique des emails</h4>
            {isLoadingEmails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Chargement...</span>
              </div>
            ) : (
              <EmailTrackingInfo emails={contactEmails} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}