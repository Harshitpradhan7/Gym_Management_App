import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper for dev testing without real credentials
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url'

// Internal session memory for testing without actual database
let mockSessionData = [
  { id: '1', full_name: 'Amit Sharma', phone: '9876543210', plan_type: 'Monthly', joining_date: '2026-03-01', expiry_date: '2026-04-01', status: 'expired', qr_code_data: 'BG-101' },
  { id: '2', full_name: 'Suresh Kumar', phone: '9988776655', plan_type: 'Quarterly', joining_date: '2026-04-01', expiry_date: '2026-07-01', status: 'active', qr_code_data: 'BG-102' },
  { id: '3', full_name: 'Vikram Singh', phone: '8877665544', plan_type: 'Annual', joining_date: '2026-04-01', expiry_date: '2026-04-05', status: 'expiring_soon', qr_code_data: 'BG-103' },
  { id: '4', full_name: 'Rohit Verma', phone: '7766554433', plan_type: 'Monthly', joining_date: '2026-04-05', expiry_date: '2026-05-05', status: 'active', qr_code_data: 'BG-104' }
];

const internalSupabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Mock subscription management
const authEvents = [];
const notify = (event, session) => {
  authEvents.forEach(cb => cb(event, session));
};

// Check for existing mock session on load
const MOCK_SESSION_KEY = 'sb-mock-session';
const getStoredSession = () => {
  const stored = sessionStorage.getItem(MOCK_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      // Mock Bypass for testing
      if (email === 'admin@gym.com' && password === 'admin123') {
        const user = { id: 'mock-user', email: 'admin@gym.com' };
        const session = { user, access_token: 'mock-token' };

        sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));

        // Notify subscribers!
        setTimeout(() => notify('SIGNED_IN', session), 0);
        return { data: { user, session }, error: null };
      }

      if (internalSupabase) {
        return internalSupabase.auth.signInWithPassword({ email, password });
      }
      return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
    },

    signOut: async () => {
      if (internalSupabase) return internalSupabase.auth.signOut();
      sessionStorage.removeItem(MOCK_SESSION_KEY);
      notify('SIGNED_OUT', null);
      return { error: null };
    },

    getUser: async () => {
      if (internalSupabase) return internalSupabase.auth.getUser();
      const session = getStoredSession();
      return { data: { user: session?.user ?? null }, error: null };
    },

    getSession: async () => {
      if (internalSupabase) return internalSupabase.auth.getSession();
      const session = getStoredSession();
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback) => {
      if (internalSupabase) return internalSupabase.auth.onAuthStateChange(callback);

      authEvents.push(callback);

      // Emit initial state if already logged in (for mock)
      const session = getStoredSession();
      if (session) {
        setTimeout(() => callback('SIGNED_IN', session), 0);
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authEvents.indexOf(callback);
              if (index > -1) authEvents.splice(index, 1);
            }
          }
        }
      };
    }
  },

  from: (table) => {
    if (internalSupabase) return internalSupabase.from(table);

    return {
      data: mockSessionData,
      error: null,
      select: function () { return this; },
      order: function () { return this; },
      eq: function () {
        this.single = () => Promise.resolve({ data: mockSessionData[0], error: null });
        return this;
      },
      then: function (onSuccess) {
        return Promise.resolve(onSuccess({ data: this.data, error: this.error }));
      },
      insert: function (newData) {
        const created = { id: String(Date.now()), ...newData[0] };
        mockSessionData.push(created);
        this.data = [created];
        return this;
      },
      update: function (updateData) { return this; },
      delete: function () { return this; }
    };
  }
}
