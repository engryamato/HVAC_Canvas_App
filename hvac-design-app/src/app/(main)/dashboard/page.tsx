'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

export default function Dashboard() {
  const [projects] = useState([
    { id: 'project-1', name: 'Sample Project 1' },
    { id: 'project-2', name: 'Sample Project 2' },
  ]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <Link href="/" className={styles.backButton}>
          Back to Home
        </Link>
      </div>

      <section>
        <h2>Your Projects</h2>
        <p>Week 2 implementation - Full project list and management coming soon</p>

        <div className={styles.projectsGrid}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <h3>{project.name}</h3>
              <p>ID: {project.id}</p>
              <Link href={`/canvas/${project.id}`} className={styles.openCanvasButton}>
                Open Canvas
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
