'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useRef, useEffect } from 'react';
import styles from './ProjectCard.module.css';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions } from '../store/projectListStore';
import { estimateStorageSizeBytes, getProjectStorageKey } from '@/utils/storageKeys';

interface ProjectCardProps {
  project: ProjectListItem;
  onDelete: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onRename: (projectId: string, newName: string) => void;
}

export function ProjectCard({
  project,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onRename,
}: ProjectCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(project.projectName);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  // Relative date formatting (UJ-PM-002: "2 hours ago", "Yesterday", "Jan 15")
  const formattedDate = useMemo(() => {
    const date = new Date(project.modifiedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }, [project.modifiedAt]);

  const storageSizeLabel = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const data = localStorage.getItem(getProjectStorageKey(project.projectId));
    const sizeBytes = estimateStorageSizeBytes(data);
    if (!sizeBytes) {
      return null;
    }

    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    }

    const sizeKb = sizeBytes / 1024;
    if (sizeKb < 1024) {
      return `${sizeKb.toFixed(1)} KB`;
    }

    const sizeMb = sizeKb / 1024;
    return `${sizeMb.toFixed(1)} MB`;
  }, [project.projectId, project.modifiedAt]);

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (trimmed.length >= 1 && trimmed.length <= 100) {
      onRename(project.projectId, trimmed);
      setEditing(false);
    }
  };

  const { markAsOpened } = useProjectListActions();

  // Navigate to canvas when clicking the card (per PRD FR-DASH-003 and US-PM-002)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return;
    }
    markAsOpened(project.projectId);
    router.push(`/canvas/${project.projectId}`);
  };

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsOpened(project.projectId);
    router.push(`/canvas/${project.projectId}`);
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="article"
      data-testid="project-card"
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.header}>
        {editing ? (
          <div className={styles.renameRow}>
            <input
              aria-label="Project name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
                if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <button onClick={handleRename} className={styles.actionButton}>
              Save
            </button>
          </div>
        ) : (
          <h3 className={styles.title}>{project.projectName}</h3>
        )}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className={styles.menuButton}
            onPointerDown={(e) => {
              e.stopPropagation(); 
              e.preventDefault(); 
              setShowMenu((s) => !s); 
            }}
            aria-label="Project actions"
            data-testid="project-card-menu-btn"
          >
            ⋮
          </button>
          <div 
            className={styles.menu} 
            data-testid="project-card-menu"
            style={{ display: showMenu ? 'flex' : 'none' }}
          >
            <button data-testid="menu-edit-btn" onClick={() => { setEditing(true); setShowMenu(false); }}>
              Rename
            </button>
            <button data-testid="menu-duplicate-btn" onClick={() => {
              onDuplicate(project.projectId);
              setShowMenu(false);
            }}>
              Duplicate
            </button>
            {project.isArchived ? (
              <button data-testid="menu-restore-btn" onClick={() => { onRestore(project.projectId); setShowMenu(false); }}>
                Restore
              </button>
            ) : (
              <button data-testid="menu-archive-btn" onClick={() => { onArchive(project.projectId); setShowMenu(false); }}>
                Archive
              </button>
            )}
            <button
              data-testid="menu-delete-btn"
              onClick={() => { onDelete(project.projectId); setShowMenu(false); }}
              className={styles.danger}
            >
              Delete
            </button>
          </div>

        </div>
      </div>
      <div className={styles.meta}>
        <span>{formattedDate}</span>
        {project.entityCount !== undefined && <span>{project.entityCount} items</span>}
        {project.projectNumber && <span>#{project.projectNumber}</span>}
        {project.clientName && <span>{project.clientName}</span>}
        {storageSizeLabel && <span>{storageSizeLabel}</span>}
        {project.isArchived && <span className={styles.archived}>Archived</span>}
      </div>
      <div className={styles.actions}>
        <button
          onClick={handleOpenClick}
          className={styles.openButton}
          role="button"
          aria-label={`Open ${project.projectName}`}
        >
          Open
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
