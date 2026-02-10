import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast, type Toast as ToastType } from './ToastContext';

const toastIcons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
};

const toastColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
};

function Toast({ toast }: { toast: ToastType }) {
    const { removeToast } = useToast();
    const Icon = toastIcons[toast.type];

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out animate-in slide-in-from-right ${toastColors[toast.type]}`}
            role="alert"
        >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{toast.title}</h4>
                {toast.message && (
                    <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const { toasts } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
            <div className="pointer-events-auto space-y-2">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
}
