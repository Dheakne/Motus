/**
 * Converte data DD/MM/YYYY para YYYY-MM-DD (formato SQL).
 */
export function convertToSQLDate(dateString) {
  if (!dateString || dateString.length < 8) return null;

  const cleaned = dateString.replace(/\D/g, "");

  if (cleaned.length === 8) {
    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY.
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}
