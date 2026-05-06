import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function updateManifest(variant) {
  const href = variant === 'store' ? '/manifest-store.webmanifest' : '/manifest.webmanifest';
  let manifest = document.querySelector('link[rel="manifest"]');

  if (!manifest) {
    manifest = document.createElement('link');
    manifest.rel = 'manifest';
    document.head.appendChild(manifest);
  }

  if (manifest.getAttribute('href') !== href) {
    manifest.setAttribute('href', href);
  }
}

export default function InstallAppButton({ variant = 'floating', onDone }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [fallbackMessage, setFallbackMessage] = useState('');

  useEffect(() => {
    updateManifest(variant);

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
  }, [variant]);

  const installApp = async () => {
    if (!promptEvent) {
      setFallbackMessage('إذا لم يبدأ التحميل، افتح قائمة المتصفح واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.');
      return;
    }

    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setPromptEvent(null);
      onDone?.();
    }
  };

  if (installed) {
    return null;
  }

  if (variant === 'dashboard') {
    return (
      <div className="rounded-2xl border border-gold-100 bg-white/80 p-3 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-gold-100">
              <img src="/pwa-icon-192.png" alt="Accessories" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gold-700">تحميل تطبيق الإدارة</div>
              <div className="text-xs font-semibold text-violet-400">ثبّت التطبيق على الهاتف لفتح لوحة الإدارة بسرعة</div>
            </div>
          </div>
          <button
            type="button"
            onClick={installApp}
            className="btn-primary h-11 shrink-0 px-4"
          >
            <Download size={18} />
            <span>تحميل الآن</span>
          </button>
        </div>
        {fallbackMessage && (
          <p className="mt-2 text-xs font-semibold text-rose-500">{fallbackMessage}</p>
        )}
      </div>
    );
  }

  if (variant === 'store') {
    return (
      <div className="rounded-2xl border border-gold-100 bg-white/80 p-3 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-gold-100">
              <img src="/pwa-icon-192.png" alt="Accessories" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gold-700">تحميل تطبيق المتجر</div>
              <div className="text-xs font-semibold text-violet-400">ثبّت واجهة الزبائن لفتح المتجر مباشرة</div>
            </div>
          </div>
          <button
            type="button"
            onClick={installApp}
            className="btn-primary h-11 shrink-0 px-4"
          >
            <Download size={18} />
            <span>تحميل الآن</span>
          </button>
        </div>
        {fallbackMessage && (
          <p className="mt-2 text-xs font-semibold text-rose-500">{fallbackMessage}</p>
        )}
      </div>
    );
  }

  if (!promptEvent) {
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
