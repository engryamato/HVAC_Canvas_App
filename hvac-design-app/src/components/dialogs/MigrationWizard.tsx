import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Database, 
  RotateCcw,
  Save,
  Clock
} from 'lucide-react';
import { VersionDetector, DataVersion, CURRENT_DATA_VERSION } from '@/core/services/migration/VersionDetector';
import { MigrationRegistry, MigrationResult, MigrationError } from '@/core/services/migration/MigrationRegistry';
import { BackupManager, BackupMetadata } from '@/core/services/migration/BackupManager';

interface MigrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  data: unknown;
  onMigrationComplete: (data: unknown) => void;
}

type WizardStep = 'detect' | 'backup' | 'migrate' | 'review' | 'complete' | 'error';

export function MigrationWizard({ isOpen, onClose, data, onMigrationComplete }: MigrationWizardProps) {
  const [step, setStep] = useState<WizardStep>('detect');
  const [detectedVersion, setDetectedVersion] = useState<DataVersion | null>(null);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const migrationRegistry = new MigrationRegistry();
  const backupManager = new BackupManager();

  // Reset state when wizard opens or data changes to ensure fresh migration flow
  useEffect(() => {
    if (isOpen) {
      setStep('detect');
      setDetectedVersion(null);
      setBackupMetadata(null);
      setMigrationResult(null);
      setError(null);
      setProgress(0);
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (isOpen && step === 'detect') {
      detectVersion();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (step === 'migrate') {
      handleMigrate();
    }
  }, [step]);

  const detectVersion = () => {
    const version = VersionDetector.detectVersion(data);
    setDetectedVersion(version);

    if (!VersionDetector.isVersionSupported(version)) {
      setStep('error');
      setError(`Version ${VersionDetector.versionToString(version)} is not supported for migration`);
      return;
    }

    if (!VersionDetector.needsMigration(version)) {
      setStep('complete');
      return;
    }

    setStep('backup');
  };

  const handleCreateBackup = async () => {
    if (!detectedVersion) return;

    setProgress(25);

    try {
      const metadata = await backupManager.createPreMigrationBackup(
        data,
        VersionDetector.versionToString(detectedVersion)
      );
      setBackupMetadata(metadata);
      setProgress(50);
      setStep('migrate');
    } catch (err) {
      setStep('error');
      setError(`Failed to create backup: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleMigrate = async () => {
    if (!detectedVersion) return;

    setProgress(75);

    try {
      const result = await migrationRegistry.autoMigrate(data);
      setMigrationResult(result);
      setProgress(100);

      if (result.success) {
        setStep('review');
      } else {
        setStep('error');
        setError(result.errors.map((e) => e.message).join(', '));
      }
    } catch (err) {
      setStep('error');
      setError(`Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleComplete = () => {
    if (migrationResult?.success && migrationResult.data) {
      onMigrationComplete(migrationResult.data);
    }
    onClose();
  };

  const handleRollback = async () => {
    if (!backupMetadata) return;

    try {
      const backup = await backupManager.restoreBackup(backupMetadata.id);
      if (backup) {
        onMigrationComplete(backup.data);
      }
      onClose();
    } catch (err) {
      setError(`Rollback failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'detect':
        return (
          <div className="space-y-4 text-center py-8">
            <Database className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">Detecting Data Version...</h3>
            <p className="text-muted-foreground">
              Analyzing your project data to determine the correct migration path.
            </p>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Backup Required</h3>
                <p className="text-muted-foreground">
                  We will create a backup before migrating your data.
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Version</span>
                  <Badge variant="secondary">
                    {detectedVersion && VersionDetector.versionToString(detectedVersion)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Version</span>
                  <Badge variant="default">
                    {VersionDetector.versionToString(CURRENT_DATA_VERSION)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Migration Path</span>
                  <span className="text-sm">
                    {detectedVersion && 
                      VersionDetector.getMigrationPath(detectedVersion).join(' → ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Save className="h-4 w-4" />
              <AlertDescription>
                A backup will be created automatically. You can rollback if anything goes wrong.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'migrate':
        return (
          <div className="space-y-4 text-center py-8">
            <div className="relative">
              <Database className="h-12 w-12 mx-auto text-primary animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold">Migrating Data...</h3>
            <Progress value={progress} className="w-full" />
            <p className="text-muted-foreground">
              Please do not close this window while migration is in progress.
            </p>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Migration Successful!</h3>
                <p className="text-muted-foreground">
                  Your data has been successfully migrated to the new format.
                </p>
              </div>
            </div>

            {migrationResult && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Steps Completed</span>
                    <span className="font-medium">{migrationResult.steps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warnings</span>
                    <Badge variant={migrationResult.warnings.length > 0 ? 'secondary' : 'outline'}>
                      {migrationResult.warnings.length}
                    </Badge>
                  </div>
                  {migrationResult.warnings.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <ul className="list-disc list-inside">
                        {migrationResult.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {backupMetadata && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Backup created: {backupMetadata.name} ({new Date(backupMetadata.createdAt).toLocaleString()})
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4 text-center py-8">
            <div className="p-3 bg-green-100 rounded-full inline-block">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">No Migration Needed</h3>
            <p className="text-muted-foreground">
              Your data is already in the latest format (v{VersionDetector.versionToString(CURRENT_DATA_VERSION)}).
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Migration Failed</h3>
                <p className="text-muted-foreground">
                  We encountered an error during migration.
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {migrationResult?.errors && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Error Details</h4>
                  <ul className="text-sm space-y-1">
                    {migrationResult.errors.map((err: MigrationError, i: number) => (
                      <li key={i} className="text-muted-foreground">
                        • {err.type}: {err.message}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {backupMetadata && (
              <Alert>
                <RotateCcw className="h-4 w-4" />
                <AlertDescription>
                  You can rollback to the backup created before migration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'backup':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>
              Create Backup & Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );

      case 'migrate':
        return (
          <Button disabled>
            Migrating...
          </Button>
        );

      case 'review':
        return (
          <>
            <Button variant="outline" onClick={handleRollback}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback
            </Button>
            <Button onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          </>
        );

      case 'complete':
        return (
          <Button onClick={onClose}>
            Close
          </Button>
        );

      case 'error':
        return (
          <>
            {backupMetadata ? (
              <Button variant="outline" onClick={handleRollback}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback to Backup
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            <Button onClick={() => setStep('detect')}>
              Try Again
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MigrationWizard;
