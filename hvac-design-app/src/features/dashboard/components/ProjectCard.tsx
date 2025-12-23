'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { ProjectListItem } from '../store/projectListStore';
import styles from './ProjectCard.module.css';

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
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.projectName);
  const menuRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRenameSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Clear any pending blur timeout to prevent cancel after submit
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      const trimmedName = newName.trim();
      if (trimmedName && trimmedName !== project.projectName) {
        onRename(project.projectId, trimmedName);
      }
      setIsRenaming(false);
    },
    [newName, project.projectId, project.projectName, onRename]
  );

  const handleRenameCancel = useCallback(() => {
    setNewName(project.projectName);
    setIsRenaming(false);
  }, [project.projectName]);

  const handleRenameBlur = useCallback(() => {
    // Delay cancel to allow submit to fire first
    blurTimeoutRef.current = setTimeout(() => {
      handleRenameCancel();
    }, 150);
  }, [handleRenameCancel]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${styles.card} ${project.isArchived ? styles.archived : ''}`}>
      <div className={styles.header}>
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className={styles.renameForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              maxLength={100}
              onBlur={handleRenameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {handleRenameCancel();}
              }}
            />
          </form>
        ) : (
          <h3 className={styles.title}>{project.projectName}</h3>
        )}

        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Project menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <span className={styles.menuIcon}>&#8942;</span>
          </button>

          {showMenu && (
            <div className={styles.menu} role="menu">
              <button role="menuitem" onClick={() => { setIsRenaming(true); setShowMenu(false); }}>
                Rename
              </button>
              <button role="menuitem" onClick={() => { onDuplicate(project.projectId); setShowMenu(false); }}>
                Duplicate
              </button>
              <div className={styles.menuDivider} role="separator" />
              {project.isArchived ? (
                <button role="menuitem" onClick={() => { onRestore(project.projectId); setShowMenu(false); }}>
                  Restore
                </button>
              ) : (
                <button role="menuitem" onClick={() => { onArchive(project.projectId); setShowMenu(false); }}>
                  Archive
                </button>
              )}
              <button
                role="menuitem"
                className={styles.dangerItem}
                onClick={() => { onDelete(project.projectId); setShowMenu(false); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        {project.projectNumber && (
          <span className={styles.projectNumber}>{project.projectNumber}</span>
        )}
        {project.clientName && (
          <span className={styles.clientName}>{project.clientName}</span>
        )}
      </div>

      <div className={styles.dates}>
        <span>Created: {formatDate(project.createdAt)}</span>
        <span>Modified: {formatDate(project.modifiedAt)}</span>
      </div>

      {project.isArchived ? (
        <div className={styles.archivedBadge}>Archived</div>
      ) : (
        <Link href={`/canvas/${project.projectId}`} className={styles.openButton}>
          Open Canvas
        </Link>
      )}
    </div>
  );
}

export default ProjectCard;
