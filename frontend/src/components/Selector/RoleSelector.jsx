import styles from "./Selector.module.css";

export function RoleSelector({ value, setValue }) {
  return (
    <div className={styles.container}>
      <label>
        Selecione o tipo de consulta:
      </label>

      <div className={styles.radioGroup}>
        <div className={styles.radioOption}>
          <input
            type="radio"
            id="professor"
            name="role"
            value="professor"
            checked={value === "professor"}
            onChange={(e) => setValue(e.target.value)}
            className={styles.radioInput}
          />
          <label htmlFor="professor" className={styles.radioLabel}>
            Professor
          </label>
        </div>

        <div className={styles.radioOption}>
          <input
            type="radio"
            id="aeri"
            name="role"
            value="aeri"
            checked={value === "aeri"}
            onChange={(e) => setValue(e.target.value)}
            className={styles.radioInput}
          />
          <label htmlFor="aeri" className={styles.radioLabel}>
            AERI
          </label>
        </div>
      </div>
    </div>
  );
}