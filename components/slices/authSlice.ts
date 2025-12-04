import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 1. Define the type for the user object within the state
interface User {
  id: string | null;
  name: string | null;
  phone: string | null;
  role: string | null;
  userType?: string | null;
}

// 2. Define the interface for the entire slice state
interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}

// 3. Define the interface for the 'loginSuccess' action payload
interface LoginPayload {
  id: string;
  name: string;
  phone: string;
  token: string;
  role: string;
  userType?: string;
}

// 4. Define the initial state using the AuthState interface
const initialState: AuthState = {
  user: null,
  token: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // loginSuccess now uses PayloadAction with the specific LoginPayload type
    loginSuccess(state, action: PayloadAction<LoginPayload>) {
      const { id, name, phone, token, role, userType } = action.payload;
      // Store user details (excluding token)
      state.user = { id, name, phone, role, userType };
      state.token = token; // Store token separately
      state.isLoggedIn = true;
    },

    // logout uses PayloadAction without any specific payload (void)
    logout(state) {
      // Reset the state to log the user out
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;