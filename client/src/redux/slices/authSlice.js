import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const user = JSON.parse(localStorage.getItem('user') || null );
const accessToken = localStorage.getItem('accessToken');

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (credential, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google sign-in failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore network errors on logout
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to get user');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', profileData);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user || null,
    accessToken: accessToken || null,
    sellerProfile: null,
    loading: false,
    googleLoading: false,
    error: null,
    isAuthenticated: !!user && !!accessToken,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Login ──
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Google Login ──
      .addCase(googleLogin.pending, (state) => { state.googleLoading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.googleLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.googleLoading = false;
        state.error = action.payload;
      })

      // ── Register ──
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Logout ──
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.sellerProfile = null;
      })

      // ── Get Me ──
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.sellerProfile = action.payload.sellerProfile;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // ── Update Profile ──
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
