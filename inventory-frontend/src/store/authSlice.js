import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await api.post("/api/auth/login", { email, password });
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Login failed");
        }
    }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { getState }) => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
        if (refreshToken) {
            await api.post("/api/auth/logout", { refreshToken });
        }
    } catch (err) {
        console.error("Logout request error:", err);
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
    }
});

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem("user");
        if (!stored || stored === "undefined" || stored === "null") return null;
        return JSON.parse(stored);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
};

const initialState = {
    user: getStoredUser(),
    accessToken: localStorage.getItem("accessToken") || null,
    isAuthenticated: !!(localStorage.getItem("accessToken") && getStoredUser()),
    loading: false,
    error: null,
};


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            localStorage.setItem("user", JSON.stringify(action.payload.user));
            localStorage.setItem("accessToken", action.payload.accessToken);
            localStorage.setItem("token", action.payload.accessToken);
        },
        clearAuth: (state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
                localStorage.setItem("accessToken", action.payload.accessToken);
                localStorage.setItem("token", action.payload.accessToken);
                localStorage.setItem("refreshToken", action.payload.refreshToken);
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                localStorage.removeItem("accessToken");
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
            });
    },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
