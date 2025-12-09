import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h1>SizeWise HVAC Canvas</h1>
      <p>Professional HVAC design and estimation desktop application</p>

      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.link}>
          Go to Dashboard
        </Link>
      </nav>
    </div>
  );
}
