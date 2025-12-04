import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default API = {
  // USERS
  getAllUsers: (token: string, userType: string) => api.post("/user/get-all-user", {
    token, userType
  }),
  getUserList: (followUpId: string, userType: string) => api.post("/user/get-user-list", { followUpId, userType }),
  checkUser: () => api.get("/user/check-user"),

  // CUSTOMER
  getUnReserved: (token: string, userType: string) => api.post("/customer/get-un-resrerved-customer", {
    token, userType
  }),
  assignCustomer: (data: any) => api.post("/customer/assign-customer-to-user", data),
  editCustomer: (data: any) => api.put("/customer/edit-customer", data),
  addCustomer: (data: any) => api.post("/customer/add-customer", data),

  // ADMIN
  getAdmins: () => api.get("/admins/get-admins"),
};
