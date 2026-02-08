
import { MigrationProgress } from '@/core/persistence/migrationHelper';

interface FolderSetupProgressProps {
  progress: MigrationProgress;
}

export function FolderSetupProgress({ progress }: FolderSetupProgressProps) {
  // Guard against division by zero
  const percentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">Migrating projects...</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {progress.completed} / {progress.total}
        </span>
      </div>

      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.current && (
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          Current: {progress.current}
        </p>
      )}

      {progress.errors.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {progress.errors.length} projects failed to migrate
        </p>
      )}
    </div>
  );
}
