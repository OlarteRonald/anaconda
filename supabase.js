// Supabase initialization
const SUPABASE_PROJECT_URL = 'https://jagjmtfblzbghqqnfyvl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UUKWlPUYyPWe--bTsGRZHA_AK3QEAp6';

// Let's check the global 'supabase' object provided by the CDN
const supabaseClient = window.supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);

const SupabaseManager = {
    async signUp(email, password, username) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data; 
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    async saveScore(userId, username, score, time) {
        const { data, error } = await supabaseClient
            .from('scores')
            .insert([
                { user_id: userId, username, score: Math.floor(score), time: Math.floor(time) }
            ]);
        if (error) {
            console.error('Cant save score:', error);
        }
        return data;
    },

    async getGlobalTop5() {
        const { data, error } = await supabaseClient
            .from('scores')
            .select('username, score, time')
            .order('score', { ascending: false })
            .limit(5);
        if (error) throw error;
        return data || [];
    },

    async getPersonalTop5(userId) {
        const { data, error } = await supabaseClient
            .from('scores')
            .select('score, time, created_at')
            .eq('user_id', userId)
            .order('score', { ascending: false })
            .limit(5);
        if (error) throw error;
        return data || [];
    }
};
