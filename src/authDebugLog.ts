// Stockage temporaire des logs d'auth en mémoire (pour debug uniquement)
export const authDebugLogs: string[] = [];

export function addAuthDebugLog(message: string) {
  const timestamp = new Date().toISOString();
  authDebugLogs.push(`[${timestamp}] ${message}`);
  
  // Garder seulement les 50 derniers logs
  if (authDebugLogs.length > 50) {
    authDebugLogs.shift();
  }
}

export function getAuthDebugLogs() {
  return authDebugLogs;
}