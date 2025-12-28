'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import styles from './ProjectCard.module.css';
import type { ProjectListItem } from '../store/projectListStore';

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

  const formattedDate = useMemo(
    () => new Date(project.modifiedAt).toLocaleString(),
    [project.modifiedAt]
  );

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (trimmed.length >= 1 && trimmed.length <= 100) {
      onRename(project.projectId, trimmed);
      setEditing(false);
    }
  };

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
    router.push(`/canvas/${project.projectId}`);
  };

  return (
    <div
      className={styles.card}
      onMouseLeave={() => setShowMenu(false)}
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
        <button
          className={styles.menuButton}
          onClick={() => setShowMenu((s) => !s)}
          aria-label="Project actions"
        >
          ⋮
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button onClick={() => { setEditing(true); setShowMenu(false); }}>
              Rename
            </button>
            <button onClick={() => { onDuplicate(project.projectId); setShowMenu(false); }}>
              Duplicate
            </button>
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
              onClick={() => { onDelete(project.projectId); setShowMenu(false); }}
              className={styles.danger}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <span>Last modified: {formattedDate}</span>
        {project.projectNumber && <span>#{project.projectNumber}</span>}
        {project.clientName && <span>{project.clientName}</span>}
        {project.isArchived && <span className={styles.archived}>Archived</span>}
      </div>
      <Link href={`/canvas/${project.projectId}`} className={styles.openButton}>
        Open Project
      </Link>
    </div>
  );
}

export default ProjectCard;
