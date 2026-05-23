import axios from 'axios';

const API = axios.create({
    baseURL: 'https://workforce-api-fxeq.onrender.com/api'
});

export const getEmployees = () => API.get('/employees');

export const createEmployee = (employeeData) =>
    API.post('/employees', employeeData);

export const deleteEmployee = (id) =>
    API.delete(`/employees/${id}`);