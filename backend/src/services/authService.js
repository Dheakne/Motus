const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Autentica um usuário existente e retorna a sessão com o perfil.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Sessão Supabase + perfil do usuário
 */
exports.loginUser = async (email, password) => {
  const { data: session, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !session?.user) {
    const err = new Error('Email ou senha incorretos');
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (profileError) {
    const err = new Error('Erro ao buscar perfil do usuário');
    err.code = 'INTERNAL_ERROR';
    err.status = 500;
    throw err;
  }

  return {
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: session.session.expires_in,
    token_type: 'bearer',
    user: {
      id: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at,
    },
    profile,
  };
};

/**
 * Cadastra novo usuário no Supabase Auth e cria o perfil na tabela user_profiles.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.name
 * @param {string} params.lastName
 * @param {string} [params.phone]
 * @param {string} [params.birthDate] - formato DD/MM/YYYY
 * @returns {Promise<object>} Sessão Supabase + perfil criado
 */
exports.registerUser = async ({ email, password, name, lastName, phone, birthDate }) => {
  let parsedBirthDate = null;
  if (birthDate) {
    const parts = birthDate.split('/');
    if (parts.length !== 3) {
      const err = new Error('Data de nascimento inválida. Use o formato DD/MM/YYYY');
      err.code = 'INVALID_BIRTH_DATE';
      err.status = 400;
      throw err;
    }
    const [day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      const err = new Error('Data de nascimento inválida. Use o formato DD/MM/YYYY');
      err.code = 'INVALID_BIRTH_DATE';
      err.status = 400;
      throw err;
    }
    parsedBirthDate = `${year}-${month}-${day}`;
  }

  const { data: session, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (
      authError.message?.toLowerCase().includes('already registered') ||
      authError.message?.toLowerCase().includes('already been registered')
    ) {
      const err = new Error('Este email já está cadastrado');
      err.code = 'EMAIL_ALREADY_EXISTS';
      err.status = 409;
      throw err;
    }
    const err = new Error('Erro ao criar conta');
    err.code = 'INTERNAL_ERROR';
    err.status = 500;
    throw err;
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert([
      {
        user_id: userId,
        display_name: name,
        full_name: `${name} ${lastName}`.trim(),
        phone: phone || '',
        birth_date: parsedBirthDate,
        level: 1,
        total_points: 0,
        has_seen_tutus: false,
        is_premium: false,
        consent_terms: true,
        consent_health_data: true,
        consented_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (profileError) {
    logger.error({ userId, profileError }, 'CRITICAL: user_profiles insert failed after auth.signUp');
    const err = new Error('Erro ao criar perfil do usuário');
    err.code = 'INTERNAL_ERROR';
    err.status = 500;
    throw err;
  }

  return {
    access_token: session.session?.access_token,
    refresh_token: session.session?.refresh_token,
    expires_in: session.session?.expires_in,
    token_type: 'bearer',
    user: {
      id: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at,
    },
    profile,
  };
};
