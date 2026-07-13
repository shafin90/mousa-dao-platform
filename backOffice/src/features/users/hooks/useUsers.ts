import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchUsers, createUser as createUserAction, updateUser as updateUserAction, deleteUser as deleteUserAction, updateUserStatus as updateStatusAction, updateUserRole as updateRoleAction } from "../store/userSlice";

export const useUsers = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.users);
  useEffect(() => { if (items.length === 0) dispatch(fetchUsers()); }, [dispatch, items.length]);
  const create = useCallback((payload: { firstName: string; lastName: string; email: string; phone: string; password: string; role: string }) => dispatch(createUserAction(payload)), [dispatch]);
  const update = useCallback((id: string, payload: Partial<{ firstName: string; lastName: string; email: string; phone: string; password: string; role: string }>) => dispatch(updateUserAction({ id, payload })), [dispatch]);
  const remove = useCallback((id: string) => dispatch(deleteUserAction(id)), [dispatch]);
  const updateStatus = useCallback((id: string, isActive: boolean) => dispatch(updateStatusAction({ id, isActive })), [dispatch]);
  const updateRole = useCallback((id: string, role: string) => dispatch(updateRoleAction({ id, role })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchUsers()), [dispatch]);
  return { users: items, loading, error, create, update, remove, updateStatus, updateRole, refresh };
};
