jest.mock('../src/config/supabase', () => {
  const query = {
    select: () => query,
    eq: () => query,
    insert: () => query,
    single: () => Promise.resolve({ data: { user_id: 'u1' }, error: null }),
    maybeSingle: () => Promise.resolve({ data: { user_id: 'u1' }, error: null }),
  };
  return {
    from: jest.fn(() => query),
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  };
});

const authResult = {
  data: {
    user: { id: 'u1', email: 'a@b.com', created_at: 'now', identities: [{}] },
    session: { access_token: 't', refresh_token: 'r', expires_in: 3600 },
  },
  error: null,
};

const mockAuthClient = {
  auth: {
    signInWithPassword: jest.fn(() => Promise.resolve(authResult)),
    signUp: jest.fn(() => Promise.resolve(authResult)),
  },
};
jest.mock('../src/config/supabaseAuth', () => jest.fn(() => mockAuthClient));

const supabase = require('../src/config/supabase');
const createAuthClient = require('../src/config/supabaseAuth');
const { loginUser, registerUser } = require('../src/services/authService');

describe('isolamento do cliente de autenticação', () => {
  beforeEach(() => jest.clearAllMocks());

  it('login não usa o cliente service_role compartilhado', async () => {
    await loginUser('a@b.com', '123456');
    expect(createAuthClient).toHaveBeenCalled();
    expect(mockAuthClient.auth.signInWithPassword).toHaveBeenCalled();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('cadastro não usa o cliente service_role compartilhado', async () => {
    await registerUser({ email: 'a@b.com', password: '123456', name: 'A', lastName: 'B' });
    expect(createAuthClient).toHaveBeenCalled();
    expect(mockAuthClient.auth.signUp).toHaveBeenCalled();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
