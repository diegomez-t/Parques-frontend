import { Link } from "@/i18n/navigation";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Page non trouvée</h2>
        <p className={styles.description}>
          La page que vous recherchez n&apos;existe pas.
        </p>
        <Link href="/" className={styles.btn}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
