'use client';

interface VersionWarningDialogProps {
    projectVersion: string;
    appVersion: string;
    onContinue: () => void;
    onCancel: () => void;
}

/**
 * Warning dialog shown when project version is newer than app version
 */
export function VersionWarningDialog({
    projectVersion,
    appVersion,
    onContinue,
    onCancel
}: VersionWarningDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-2 text-yellow-600">Newer Project Version</h2>
                <p className="text-gray-700 mb-2">
                    This project was created with a newer version of the application.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                    Project version: <strong>{projectVersion}</strong><br />
                    App version: <strong>{appVersion}</strong>
                </p>
                <p className="text-gray-700 mb-4">
                    Some features may not work correctly. Would you like to continue?
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onContinue}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Open Anyway
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
