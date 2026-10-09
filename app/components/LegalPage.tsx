import styles from './LegalPage.module.css'

type Props = {
  title: string
  enacted: string
  children: React.ReactNode
}

export default function LegalPage({ title, enacted, children }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>制定日: {enacted}</p>
        {children}
      </div>
    </main>
  )
}
