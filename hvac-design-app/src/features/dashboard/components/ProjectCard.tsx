'use client';

import Link from 'next/link';
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

  return (
    <div
      className={styles.card}
      onMouseLeave={() => setShowMenu(false)}
      role="article"
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
