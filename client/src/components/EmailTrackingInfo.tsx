import { Eye, Info, Clock, RotateCcw, Send, FileText } from 'lucide-react';
import { UnifiedEmail } from '@/types';
import { Tooltip } from './Tooltip';

interface EmailTrackingInfoProps {
  emails: UnifiedEmail[];
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} min`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `il y a ${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `il y a ${days}j`;
  }
};

export default function EmailTrackingInfo({ emails }: EmailTrackingInfoProps) {
  if (!emails || emails.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">Aucun email envoyé à ce contact</span>
        </div>
      </div>
    );
  }

  const totalEmails = emails.length;
  const openedEmails = emails.filter(email => email.isOpened).length;
  const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Statistiques globales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Statistiques d'ouverture</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{openedEmails}/{totalEmails}</div>
            <div className="text-xs text-gray-600">Emails ouverts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{openRate.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Taux d'ouverture</div>
          </div>
        </div>
      </div>

      {/* Liste des emails récents */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900">Emails récents</h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {emails.slice(0, 5).map((email) => {
            const getEmailTypeInfo = () => {
              switch (email.type) {
                case 'relance':
                  return {
                    icon: <RotateCcw className="w-4 h-4 text-orange-600" />,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    label: 'Relance'
                  };
                case 'quote':
                  return {
                    icon: <FileText className="w-4 h-4 text-blue-600" />,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    label: 'Devis'
                  };
                default:
                  return {
                    icon: <Send className="w-4 h-4 text-green-600" />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    label: 'Email'
                  };
              }
            };

            const typeInfo = getEmailTypeInfo();

            return (
              <div key={email.id} className={`${typeInfo.bgColor} border ${typeInfo.borderColor} rounded-lg p-3 hover:shadow-sm transition-shadow`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full">
                          {typeInfo.label}
                        </span>
                        {email.type === 'relance' && email.relatedQuoteId && (
                          <span className="text-xs text-gray-500">
                            (Devis lié)
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {email.subject}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Envoyé {formatTimeAgo(email.sentAt)}
                      </div>
                    </div>
                  </div>
                
                <div className="flex items-center gap-2 ml-3">
                  {email.isOpened ? (
                    <div className="flex items-center gap-1">
                      <Tooltip 
                        content={`Première ouverture: ${formatDateTime(email.openedAt!)}`}
                        position="left"
                      >
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          <Eye className="w-3 h-3" />
                          <Clock className="w-3 h-3" />
                        </div>
                      </Tooltip>
                      
                      {email.openCount > 1 && (
                        <Tooltip 
                          content={`Ouvert ${email.openCount} fois. Dernière ouverture: ${formatDateTime(email.openedAt!)}`}
                          position="left"
                        >
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            <RotateCcw className="w-3 h-3" />
                            <span>{email.openCount}</span>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <Tooltip 
                      content="Email non ouvert"
                      position="left"
                    >
                      <div className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        <Eye className="w-3 h-3" />
                      </div>
                    </Tooltip>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {emails.length > 5 && (
          <div className="text-xs text-gray-500 text-center pt-2">
            Et {emails.length - 5} autres emails...
          </div>
        )}
      </div>
    </div>
  );
}