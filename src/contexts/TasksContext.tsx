// TypeScript + organización en carpeta contexts/	
// ahora Provee estado global de tareas con tipado TypeScript



import React, { createContext, useState, useContext } from 'react';
import { 
  createTaskRequest, 
  getTasksRequest, 
  deleteTaskRequest, 
  getTaskRequest, 
  updateTaskRequest 
} from '../api/tasks';

interface Task {
  _id: string;
  title: string;
  description: string;
  date: string;
  user: any;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  errors: string[];
  getTasks: () => Promise<{ ok: boolean }>;
  createTask: (task: any) => Promise<{ ok: boolean }>;
  deleteTask: (id: string) => Promise<{ ok: boolean }>;
  getTask: (id: string) => Promise<{ ok: boolean; data?: Task }>;
  updateTask: (id: string, task: any) => Promise<{ ok: boolean }>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const getTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasksRequest();
      setTasks(res.data);
      return { ok: true };
    } catch (error: any) {
      setErrors(error.response?.data || ['Error loading tasks']);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: any) => {
    try {
      await createTaskRequest(task);
      await getTasks();
      return { ok: true };
    } catch (error: any) {
      setErrors(error.response?.data || ['Error creating task']);
      return { ok: false };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteTaskRequest(id);
      setTasks(prev => prev.filter(task => task._id !== id));
      return { ok: true };
    } catch (error: any) {
      setErrors(error.response?.data || ['Error deleting task']);
      return { ok: false };
    }
  };

  const getTask = async (id: string) => {
    try {
      const res = await getTaskRequest(id);
      return { ok: true, data: res.data };
    } catch (error: any) {
      setErrors(error.response?.data || ['Error getting task']);
      return { ok: false };
    }
  };

  const updateTask = async (id: string, task: any) => {
    try {
      await updateTaskRequest(id, task);
      await getTasks();
      return { ok: true };
    } catch (error: any) {
      setErrors(error.response?.data || ['Error updating task']);
      return { ok: false };
    }
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        errors,
        getTasks,
        createTask,
        deleteTask,
        getTask,
        updateTask,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
};