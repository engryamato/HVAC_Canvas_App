'use client';

import React, { useState, useCallback } from 'react';
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
              onBlur={handleRenameCancel}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleRenameCancel();
              }}
            />
          </form>
        ) : (
          <h3 className={styles.title}>{project.projectName}</h3>
        )}

        <div className={styles.menuWrapper}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Project menu"
          >
            <span className={styles.menuIcon}>&#8942;</span>
          </button>

          {showMenu && (
            <div className={styles.menu}>
              <button onClick={() => { setIsRenaming(true); setShowMenu(false); }}>
                Rename
              </button>
              <button onClick={() => { onDuplicate(project.projectId); setShowMenu(false); }}>
                Duplicate
              </button>
              <div className={styles.menuDivider} />
              {project.isArchived ? (
                <button onClick={() => { onRestore(project.projectId); setShowMenu(false); }}>
                  Restore
                </button>
              ) : (
                <button onClick={() => { onArchive(project.projectId); setShowMenu(false); }}>
                  Archive
                </button>
              )}
              <button
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
