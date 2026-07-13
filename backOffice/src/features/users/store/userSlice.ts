import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "@/shared/types";
import { userService } from "../services/userService";

interface UserState {
  items: User[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = { items: [], total: 0, loading: false, error: null };

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    return await userService.getAll(params);
  }
);

export const updateUserStatus = createAsyncThunk(
  "users/updateStatus",
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    return await userService.updateStatus(id, isActive);
  }
);

export const updateUserRole = createAsyncThunk(
  "users/updateRole",
  async ({ id, role }: { id: string; role: string }) => {
    return await userService.updateRole(id, role);
  }
);

export const createUser = createAsyncThunk(
  "users/create",
  async (payload: { firstName: string; lastName: string; email: string; phone: string; password: string; role: string }) => {
    return await userService.create(payload);
  }
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, payload }: { id: string; payload: Partial<{ firstName: string; lastName: string; email: string; phone: string; password: string; role: string }> }) => {
    return await userService.update(id, payload);
  }
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id: string) => {
    await userService.remove(id);
    return id;
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.users; s.total = a.payload.total; })
      .addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(createUser.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
        s.total += 1;
      })
      .addCase(updateUserStatus.fulfilled, (s, a) => {
        const idx = s.items.findIndex(u => u._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(updateUserRole.fulfilled, (s, a) => {
        const idx = s.items.findIndex(u => u._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(updateUser.fulfilled, (s, a) => {
        const idx = s.items.findIndex(u => u._id === a.payload._id);
        if (idx >= 0) s.items[idx] = a.payload;
      })
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.items = s.items.filter(u => u._id !== a.payload);
        s.total -= 1;
      });
  },
});
export default userSlice.reducer;
