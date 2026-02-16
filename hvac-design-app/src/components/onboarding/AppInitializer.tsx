import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { useAutoOpen } from '@/hooks/useAutoOpen';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { isTauri } from '@/core/persistence/filesystem';
import { getStorageRootService } from '@/core/services/StorageRootService';
import { useStorageEvents } from '@/hooks/useStorageEvents';
import { ProjectSetupWizard, type ProjectSetupData } from '@/features/project/components/ProjectSetupWizard';
import { useProjectActions } from '@/core/store/project.store';
import { useSettingsStore } from '@/core/store/settingsStore';
import { createEmptyProject } from '@/core/schema/project-file.schema';
import { getProjectRepository } from '@/core/persistence/ProjectRepository';
import { ENABLE_PROJECT_SETUP_WIZARD } from '@/core/config/featureFlags';

export const AppInitializer: React.FC = () => {
    const router = useRouter();
    const { isFirstLaunch, isLoading, setEnvironment, setHasLaunched } = useAppStateStore();
    const { isActive: isTutorialActive, startTutorial } = useTutorialStore();
    const searchParams = useSearchParams();
    const skipSplash = searchParams.get('skipSplash') === 'true';
    const [showSplash, setShowSplash] = useState(!skipSplash);
    const [showWizard, setShowWizard] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [storageInitError, setStorageInitError] = useState<string | null>(null);

    // Project Logic
    const { setProject, setDirty } = useProjectActions();

    const handleWizardComplete = async (projectData: ProjectSetupData) => {
        const projectId = crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            const projectFile = createEmptyProject(projectData.projectName, {
                projectId,
                createdAt: now,
                modifiedAt: now,
                isArchived: false,
                location: projectData.location || undefined,
                settings: projectData.settings ? {
                    unitSystem: projectData.settings.unitSystem || 'imperial',
                    gridSize: projectData.settings.gridSize || 12,
                    gridVisible: projectData.settings.gridVisible ?? true,
                    snapToGrid: projectData.settings.snapToGrid ?? true,
                    // Include any other calculation settings from the wizard
                    ...projectData.settings
                } : undefined,
            });

            const repository = await getProjectRepository();
            const saveResult = await repository.saveProject(projectFile);
            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Failed to create project');
            }

            const projectListStore = useProjectListStore.getState();
            projectListStore.addProject({
                projectId,
                projectName: projectData.projectName,
                entityCount: 0,
                createdAt: now,
                modifiedAt: now,
                storagePath: saveResult.filePath || `project-${projectId}`,
                filePath: saveResult.filePath,
                isArchived: false,
                status: 'draft',
            });
            await projectListStore.refreshProjects();

            // 1. Initialize Project Store
            setProject(projectId, {
                projectId: projectId,
                projectName: projectData.projectName,
                isArchived: false,
                createdAt: now,
                modifiedAt: now,
                location: projectData.location,
            });

            // 2. Apply Settings
            if (projectData.settings) {
                useSettingsStore.getState().setCalculationSettings(projectData.settings);
            }

            setDirty(false);
            setHasLaunched(true);
            setShowWizard(false);
            startTutorial();
            router.push(`/canvas/${projectId}`);
        } catch (error) {
            console.error('[AppInitializer] Failed to create project from wizard:', error);
        }
    };

    // Force preferences hydration on startup
    usePreferencesStore();

    const theme = usePreferencesStore((state) => state.theme);
    const compactMode = usePreferencesStore((state) => state.compactMode);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('compact', compactMode);
    }, [theme, compactMode]);

    // Auto-open last project if enabled
    useAutoOpen();

    // Subscribe to storage events for toast notifications (PSR-11)
    useStorageEvents();


    useEffect(() => {
        setMounted(true);

        (async () => {
            // UJ-GS-006: Environment Detection
            performEnvironmentDetection();

            // Storage Initialization
            const storageReady = await performStorageInitialization();
            if (!storageReady) {
                return;
            }

            // UJ-GS-007: Integrity Checks
            performIntegrityChecks();
        })();
    }, []);

    // Handle dynamic redirection when state changes (e.g. after rehydration)
    useEffect(() => {
        // Don't redirect if tutorial is active - user is navigating to canvas
        if (isTutorialActive) {
            return;
        }

        if (!showSplash && !isFirstLaunch && !isLoading && !showWizard) {
            // Small delay to ensure Zustand stores fully hydrate (prevents test race conditions)
            const redirectTimer = setTimeout(() => {
                router.replace('/dashboard');
            }, 100);
            
            return () => clearTimeout(redirectTimer);
        }

        return;
    }, [showSplash, isFirstLaunch, isLoading, isTutorialActive, router, showWizard]);




    // Robust hydration check using store state, not localStorage parsing
    useEffect(() => {
        if (typeof window === 'undefined') {return;}
        
        const storedState = useAppStateStore.getState();
        if (storedState.hasLaunched && isFirstLaunch) {
            useAppStateStore.setState({
                isFirstLaunch: false,
                hasLaunched: true,
                isLoading: false
            });
        } else if (isFirstLaunch) {
            // Fail-safe: Check localStorage directly in case hydration missed it or race condition
            try {
                const raw = localStorage.getItem('hvac-app-storage');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Check if hasLaunched is explicitly true in persisted state
                    if (parsed?.state?.hasLaunched === true) {
                        console.warn('[AppInitializer] ⚠ Detected hasLaunched in localStorage but store missed it. Forcing update.');
                        useAppStateStore.setState({
                            isFirstLaunch: false,
                            hasLaunched: true,
                            isLoading: false
                        });
                    }
                }
            } catch (e) {
                // Ignore parse errors, standard checks will handle them
            }
        }
    }, [isFirstLaunch]);

    // UJ-GS-006: Environment Detection
    const performEnvironmentDetection = () => {
        const tauriDetected = isTauri();
        setEnvironment(tauriDetected);
    };

    // Storage Initialization
    const performStorageInitialization = async (): Promise<boolean> => {
        try {
            const service = await getStorageRootService();
            const result = await service.initialize();
            
            if (result.success) {
                try {
                    await service.validate();
                } catch (validationError) {
                    // Validation failed
                }
                setStorageInitError(null);
                return true;
            } else {
                console.error('[AppInitializer] ✗ Storage initialization failed:', result.error);
                setStorageInitError('Failed to initialize storage. Please check permissions and restart.');
                return false;
            }
        } catch (error) {
            console.error('[AppInitializer] ✗ Storage initialization error:', error);
            setStorageInitError('Failed to initialize storage. Please check permissions and restart.');
            return false;
        }
    };

    // UJ-GS-007: Integrity Checks
    const performIntegrityChecks = () => {
        console.log('[AppInitializer] Running integrity checks...');
        
        // Phase 1: localStorage preferences validation
        try {
            const prefsKey = 'sws.preferences';
            const prefsData = localStorage.getItem(prefsKey);
            
            if (prefsData) {
                JSON.parse(prefsData); // Validate JSON
                console.log('[AppInitializer] ✓ localStorage preferences valid');
            }
        } catch (error) {
            console.warn('[AppInitializer] ⚠ localStorage preferences corrupted, resetting to defaults');
            localStorage.removeItem('sws.preferences');
            // Force re-hydration with defaults
            const prefs = usePreferencesStore.getState();
            prefs.setTheme(prefs.theme);
        }
        
        // Phase 1.5: projectIndex validation
        try {
            const indexKey = 'sws.projectIndex';
            const indexData = localStorage.getItem(indexKey);
            
            if (indexData) {
                const parsed = JSON.parse(indexData);
                
                // Validate expected structure
                const hasValidState = parsed?.state && typeof parsed.state === 'object';
                const hasValidProjects = !parsed?.state?.projects || Array.isArray(parsed.state.projects);
                
                if (!hasValidState || !hasValidProjects) {
                    throw new Error('Invalid projectIndex structure');
                }
                
                // Validate each project entry has required fields
                if (parsed.state.projects?.length > 0) {
                    const hasInvalidProject = parsed.state.projects.some(
                        (p: Record<string, unknown>) => !p.projectId || !p.projectName
                    );
                    if (hasInvalidProject) {
                        console.warn('[AppInitializer] ⚠ Found projects with missing required fields');
                    }
                }
                
                console.log('[AppInitializer] ✓ localStorage projectIndex valid');
            } else {
                console.log('[AppInitializer] ℹ No projectIndex found (first launch)');
            }
        } catch (error) {
            console.warn('[AppInitializer] ⚠ localStorage projectIndex corrupted, resetting to defaults');
            localStorage.removeItem('sws.projectIndex');
            // Reset project list store to empty state
            useProjectListStore.setState({
                projects: [],
                recentProjectIds: [],
                loading: false,
                error: undefined,
            });
        }
        
        // Phase 2: IndexedDB health check
        try {
            if (typeof window !== 'undefined' && window.indexedDB) {
                console.log('[AppInitializer] ✓ IndexedDB available');
            } else {
                console.warn('[AppInitializer] ⚠ IndexedDB not available');
            }
        } catch (error) {
            console.error('[AppInitializer] ✗ IndexedDB check failed:', error);
        }
        
        // Phase 3: Tauri file system permissions (if in Tauri environment)
        if (isTauri()) {
            checkTauriFileSystemAccess();
        }
        
        console.log('[AppInitializer] ✓ Integrity checks complete');
    };

    // Check Tauri file system write permissions
    const checkTauriFileSystemAccess = async () => {
        try {
            const { getDocumentsDir } = await import('@/core/persistence/filesystem');
            const docsDir = await getDocumentsDir();
            
            if (docsDir) {
                console.log('[AppInitializer] ✓ Tauri file system accessible:', docsDir);
            } else {
                console.warn('[AppInitializer] ⚠ Could not access documents directory');
            }
        } catch (error) {
            console.error('[AppInitializer] ✗ Tauri file system check failed:', error);
        }
    };

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    if (!mounted) { return null; } // Avoid hydration mismatch

    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    if (storageInitError) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <p className="text-red-600">{storageInitError}</p>
            </div>
        );
    }

    if (isFirstLaunch) {
        if (showWizard && ENABLE_PROJECT_SETUP_WIZARD) {
            return (
                <ProjectSetupWizard
                    isOpen={true}
                    onClose={() => setShowWizard(false)}
                    onComplete={handleWizardComplete}
                />
            );
        }
        return (
            <WelcomeScreen
                onStart={() => {
                    if (!ENABLE_PROJECT_SETUP_WIZARD) {
                        setHasLaunched(true);
                        router.push('/dashboard/new');
                        return;
                    }
                    setShowWizard(true);
                }}
            />
        );
    }

    // While redirecting or loading
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <p className="text-slate-500 animate-pulse">Redirecting to dashboard...</p>
        </div>
    );
};
