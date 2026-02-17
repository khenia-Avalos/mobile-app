import { z } from 'zod';

export const createAppointmentSchema = z.object({
  title: z.string({ message: "Título es requerido" }),
  description: z.string().optional(),
  appointmentDate: z.string().or(z.date()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:mm)"
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  
  status: z.enum([
    'scheduled', 'confirmed', 'in-progress', 
    'completed', 'cancelled', 'no-show'
  ]).optional(),
  type: z.enum([
    'consulta', 'vacunacion', 'cirugia', 
    'grooming', 'urgencia', 'seguimiento', 'otros'
  ]).optional(),
  
  client: z.string({ message: "Cliente es requerido" }),
  veterinarian: z.string().optional(),
  
  service: z.string().optional(),
  price: z.number().min(0).optional(),
  paid: z.boolean().optional(),
  notes: z.string().optional()
});

export const updateAppointmentSchema = createAppointmentSchema.partial();