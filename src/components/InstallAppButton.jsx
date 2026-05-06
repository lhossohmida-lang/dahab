import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallAppButton({ variant = 'floating', onDone }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setPromptEvent(null);
      onDone?.();
    }
  };

  if (installed || !promptEvent) {
    return null;
  }

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={installApp}
        className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-l from-gold-100 to-rose-100 px-3 py-2 text-sm font-bold text-rose-500 transition hover:opacity-90"
      >
        <Download size={18} />
        <span>تحميل الآن</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={installApp}
      className="fixed bottom-20 right-4 z-[60] inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-l from-gold-400 to-rose-400 px-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
    >
      <Download size={18} />
      <span>تحميل التطبيق</span>
    </button>
  );
}
