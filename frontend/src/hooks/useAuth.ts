// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "../lib/axios";
// import { useDispatch } from "react-redux";
// import { login, logout } from "../store/slices/authSlice";
// import { setUser, clearUser } from "../store/slices/userSlice";

// export const useAuth = () => {
//   const queryClient = useQueryClient();
//   const dispatch = useDispatch();

//   // ✅ Logout
//   const doLogout = useMutation({
//     mutationFn: async () => {
//       await api.post("/auth/logout");
//     },
//     onSuccess: () => {
//       dispatch(logout());
//       dispatch(clearUser());
//       queryClient.clear();
//     },
//   });

//   return { doLogout };
// };
