import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

export const fetchWarehouses = () => api.get("/warehouses").then((r) => r.data);
export const fetchWarehouse = (id) =>
  api.get(`/warehouses/${id}`).then((r) => r.data);
export const fetchReadings = (id, limit = 60) =>
  api.get(`/warehouses/${id}/readings`, { params: { limit } }).then((r) => r.data);
export const fetchLatest = (id) =>
  api.get(`/warehouses/${id}/latest`).then((r) => r.data);
export const togglePower = (id) =>
  api.post(`/warehouses/${id}/toggle-power`).then((r) => r.data);
export const updateWarehouse = (id, body) =>
  api.patch(`/warehouses/${id}`, body).then((r) => r.data);
export const createWarehouse = (body) =>
  api.post(`/warehouses`, body).then((r) => r.data);
export const deleteWarehouse = (id) =>
  api.delete(`/warehouses/${id}`).then((r) => r.data);
export const fetchAlerts = (params = {}) =>
  api.get(`/alerts`, { params }).then((r) => r.data);
export const ackAlert = (id) =>
  api.post(`/alerts/${id}/acknowledge`).then((r) => r.data);
export const ackAllAlerts = () =>
  api.post(`/alerts/acknowledge-all`).then((r) => r.data);
export const fetchStats = () => api.get("/stats").then((r) => r.data);
export const aiAnalyze = (warehouse_id) =>
  api.post("/ai/analyze", { warehouse_id }).then((r) => r.data);
