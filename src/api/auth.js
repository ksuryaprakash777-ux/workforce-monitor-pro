import axios from 'axios';

const API = axios.create({
  baseURL: 'https://workforce-api-fxeq.onrender.com/api'
});

export const loginUser = async (data) => {
  return API.post('/auth/login', data);
};