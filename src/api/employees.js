import axios from 'axios';

const API = axios.create({
    baseURL:'http://localhost:5000/api'
});

export const getEmployees = () => API.get('/employees');

export const createEmployee = (employeeData) =>
    API.post('/employees', employeeData);

export const deleteEmployee = (id) =>
    API.delete(`/employees/${id}`);