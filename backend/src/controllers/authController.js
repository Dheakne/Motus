const { loginUser, registerUser } = require('../services/authService');
const { success, error } = require('../utils/responses');

/**
 * POST /api/auth/login
 * Autentica o usuário e retorna token + perfil.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser(email, password);
    return success(res, data);
  } catch (err) {
    if (err.status && err.code) {
      return error(res, err.status, err.code, err.message);
    }
    next(err);
  }
};

/**
 * POST /api/auth/register
 * Cadastra novo usuário e retorna token + perfil criado.
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, lastName, phone, birthDate, consent_terms, consent_health_data } =
      req.body;
    const data = await registerUser({
      email,
      password,
      name,
      lastName,
      phone,
      birthDate,
      consent_terms,
      consent_health_data,
    });
    return success(res, data, 201);
  } catch (err) {
    if (err.status && err.code) {
      return error(res, err.status, err.code, err.message);
    }
    next(err);
  }
};
