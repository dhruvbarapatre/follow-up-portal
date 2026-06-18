import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const API = {
  getAllUsers: (token: string) => api.post("/user/get-all-user", {
    token
  }),
  getUserList: (followUpId: string) => api.post("/user/get-user-list", { followUpId }),
  checkUser: () => api.get("/user/check-user"),

  // CUSTOMER
  getUnReserved: (token: string) => api.post("/customer/get-un-resrerved-customer", {
    token
  }),
  assignCustomer: (data: any) => api.post("/customer/assign-customer-to-user", data),
  editCustomer: (data: any) => api.put("/customer/edit-customer", data),
  addCustomer: (data: any) => api.post("/customer/add-customer", data),
  getAllCustomers: () => api.post("/customer/get-all-customer"),

  // ADMIN
  getAdmins: () => api.get("/admins/get-admins"),

  // ATTENDANCE
  getPrograms: () => api.get("/attendence/list?t=" + Date.now()),
  createProgram: (data: any) => api.post("/attendence/create", data),
  updateProgram: (data: any) => api.put("/attendence/update", data),
  deleteProgram: (id: string) => api.delete("/attendence/delete", { data: { id } }),
};

export default API;

