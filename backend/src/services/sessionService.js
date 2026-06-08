const supabase = require('../config/supabase');
const { storageBucket } = require('../config/env');

/**
 * Busca uma sessão de áudio pelo ID, verifica acesso premium e gera URL assinada.
 * @param {string} sessionId - UUID da sessão
 * @param {string} userId - ID do usuário autenticado
 * @returns {Promise<object>} Sessão com audio_url válida por 1 hora
 */
exports.getSessionById = async (sessionId, userId) => {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, title, duration, audio_url, category, is_premium, created_at')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    const err = new Error('Sessão não encontrada');
    err.code = 'SESSION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (session.is_premium) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.is_premium) {
      const err = new Error(
        'Esta sessão requer uma assinatura premium. Faça upgrade para continuar.'
      );
      err.code = 'PREMIUM_REQUIRED';
      err.status = 403;
      throw err;
    }
  }

  // Gera URL assinada se audio_url for path relativo (não começa com http)
  if (session.audio_url && !session.audio_url.startsWith('http')) {
    const { data: signedData, error: storageError } = await supabase.storage
      .from(storageBucket)
      .createSignedUrl(session.audio_url, 3600);

    if (storageError || !signedData?.signedUrl) {
      const err = new Error('Erro ao acessar o arquivo de áudio');
      err.code = 'STORAGE_ERROR';
      err.status = 500;
      throw err;
    }

    session.audio_url = signedData.signedUrl;
  }

  return { session };
};
