const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'MISSING_TOKEN',
      message: 'Token de autenticação não fornecido',
    });
  }

  const token = header.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token inválido ou expirado',
    });
  }

  req.user = user;
  next();
};
