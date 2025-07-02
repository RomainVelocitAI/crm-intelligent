import { useState } from 'react';
import { Play, X, Lightbulb } from 'lucide-react';

interface TutorialProposalModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TutorialProposalModal({ 
  isOpen, 
  onAccept, 
  onDecline 
}: TutorialProposalModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleDecline = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDecline();
      setIsClosing(false);
    }, 300);
  };

  const handleAccept = () => {
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Header avec icône */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Play className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">Découvrir VelocitaLeads ?</h2>
          <p className="text-indigo-100 text-center mt-2">
            Voulez-vous faire un tour guidé de l'application ?
          </p>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-3">
            <p className="text-gray-700">
              Un tutoriel interactif vous aidera à découvrir toutes les fonctionnalités 
              de VelocitaLeads en quelques minutes.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">✓</span>
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-1">Ce que vous apprendrez :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Gérer vos contacts efficacement</li>
                    <li>• Créer et envoyer des devis professionnels</li>
                    <li>• Suivre vos performances avec les métriques</li>
                    <li>• Optimiser votre workflow quotidien</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleAccept}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              <span>Oui, commencer le tutoriel !</span>
            </button>
            
            <button
              onClick={handleDecline}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <Lightbulb className="w-5 h-5" />
              <span>Non merci, peut-être plus tard</span>
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Si vous refusez, une ampoule apparaîtra pour relancer le tutoriel plus tard
          </p>
        </div>
      </div>
    </div>
  );
}