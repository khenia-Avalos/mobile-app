import axios from './axios';

export const getTasksRequest = () => axios.get('/api/tasks');
export const getTaskRequest = (id: string) => axios.get(`/api/tasks/${id}`);
export const createTaskRequest = (task: any) => axios.post('/api/tasks', task);
export const updateTaskRequest = (id: string, task: any) => 
  axios.put(`/api/tasks/${id}`, task);
export const deleteTaskRequest = (id: string) => axios.delete(`/api/tasks/${id}`);

//MISMO TASKS.JS
/* Funciones tasks API
	TypeScript añade seguridad de tipos	
  Mismas funciones pero con tipado de parámetros y respuestas */