import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, setAuthToken } from "@/services/api";

export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, thunkAPI) => {
    try {
      return await api.auth.me();
    } catch (error) {
      setAuthToken(null);
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Failed to load user",
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await api.auth.login(data.email, data.password);
      console.log(response)
      setAuthToken(response.token);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Login failed",
      );
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (data: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await api.auth.signup(data.email, data.password);
      if (response.token) {
        setAuthToken(response.token);
      }
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Signup failed",
      );
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await api.auth.logout();
  } finally {
    setAuthToken(null);
  }
});
