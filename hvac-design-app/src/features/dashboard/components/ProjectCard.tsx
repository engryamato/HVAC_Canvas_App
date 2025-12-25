'use client';

import { useMemo, useState } from 'react';
import styles from './ProjectCard.module.css';
import type { ProjectMeta } from '../store/projectListStore';

interface ProjectCardProps {
  project: ProjectMeta;
  onOpen: (project: ProjectMeta) => void;
  onArchive: (project: ProjectMeta) => void;
  onDelete: (project: ProjectMeta) => void;
  onDuplicate: (project: ProjectMeta) => void;
  onRename: (project: ProjectMeta, newName: string) => void;
}

export function ProjectCard({ project, onOpen, onArchive, onDelete, onDuplicate, onRename }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(project.name);

  const formattedDate = useMemo(() => new Date(project.lastModified).toLocaleString(), [project.lastModified]);

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (trimmed.length >= 1 && trimmed.length <= 100) {
      onRename(project, trimmed);
      setEditing(false);
    }
  };

  return (
    <div
      className={styles.card}
      onDoubleClick={() => onOpen(project)}
      onMouseLeave={() => setShowMenu(false)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.header}>
        {editing ? (
          <div className={styles.renameRow}>
            <input
              aria-label="Project name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <button onClick={handleRename} className={styles.actionButton}>
              Save
            </button>
          </div>
        ) : (
          <h3 className={styles.title}>{project.name}</h3>
        )}
        <button className={styles.menuButton} onClick={() => setShowMenu((s) => !s)} aria-label="Project actions">
          ⋮
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button onClick={() => setEditing(true)}>Rename</button>
            <button onClick={() => onDuplicate(project)}>Duplicate</button>
            <button onClick={() => onArchive(project)}>Archive</button>
            <button onClick={() => onDelete(project)} className={styles.danger}>
              Delete
            </button>
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <span>Last modified: {formattedDate}</span>
        <span>Entities: {project.entityCount}</span>
        {project.archived && <span className={styles.archived}>Archived</span>}
      </div>
      <button className={styles.openButton} onClick={() => onOpen(project)}>
        Open Project
      </button>
    </div>
  );
}

export default ProjectCard;
