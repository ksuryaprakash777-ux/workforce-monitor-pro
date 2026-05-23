import axios from 'axios';

const API = axios.create({
  baseURL: 'https://workforce-api-fxeq.onrender.com/api'
});

export const login = (data) =>
  API.post('/auth/login', data);