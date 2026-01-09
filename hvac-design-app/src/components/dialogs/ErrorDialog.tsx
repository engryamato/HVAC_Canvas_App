'use client';

interface ErrorDialogProps {
    message: string;
    onClose: () => void;
}

/**
 * Generic error dialog for displaying error messages
 * Used for corrupted projects, load failures, etc.
 */
export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-2 text-red-600">Project Cannot Be Opened</h2>
                <p className="text-gray-700 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
