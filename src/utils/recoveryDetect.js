// Captura a flag de recovery do hash da URL antes do Supabase
// limpar. Este arquivo DEVE ser importado antes de qualquer módulo
// que inicialize o Supabase.
if (typeof window !== 'undefined' &&
    window.location.hash.includes('type=recovery')) {
  window.__motusIsRecovery = true;
  console.log('[RECOVERY DETECT] Flag setada: type=recovery encontrado');
}
