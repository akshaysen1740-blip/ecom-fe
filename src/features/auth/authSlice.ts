import { createSlice } from "@reduxjs/toolkit";
import { ApiUser, getAuthToken, setAuthToken } from "@/services/api";
import { fetchCurrentUser, loginUser, logoutUser, signupUser } from "./authThunks";

interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: getAuthToken(),
  loading: false,
  initialized: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
      setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.accessToken = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user ?? null;
        state.accessToken = action.payload.token ?? state.accessToken;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
        state.error = null;
      });
  },
});

export const { clearAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
