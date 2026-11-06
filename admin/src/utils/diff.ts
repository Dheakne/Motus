/**
 * Só os campos de `next` que mudaram em relação a `current`.
 * Usado nos PATCH para o audit log registrar só o que de fato foi alterado.
 */
export function changedFields<T extends object>(current: Partial<T>, next: T): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(next) as Array<keyof T>) {
    if (next[key] !== current[key]) changes[key] = next[key];
  }
  return changes;
}

/** String vazia (ou só espaços) vira null, para limpar campos opcionais no banco. */
export const emptyToNull = (value: string) => (value.trim() ? value.trim() : null);
