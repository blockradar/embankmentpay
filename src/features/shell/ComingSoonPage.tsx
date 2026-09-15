import styles from "./ComingSoonPage.module.css";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.desc}>
        This flow is designed and reviewed in a later phase, built on the same shell and mock
        data layer as the Dashboard.
      </p>
    </div>
  );
}
