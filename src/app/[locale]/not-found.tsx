"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.description}>{t("description")}</p>
        <Link href="/" className={styles.btn}>
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
