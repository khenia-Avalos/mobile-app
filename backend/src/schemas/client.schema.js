import { z } from 'zod';

export const createClientSchema = z.object({
  ownerName: z.string({ message: "Nombre del dueño es requerido" }),
  ownerLastName: z.string({ message: "Apellido del dueño es requerido" }),
  ownerEmail: z.string().email({ message: "Email inválido" }),
  ownerPhone: z.string({ message: "Teléfono es requerido" }),
  ownerAddress: z.string().optional(),
  
  petName: z.string({ message: "Nombre de la mascota es requerido" }),
  petSpecies: z.enum(['Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro']),
  petBreed: z.string().optional(),
  petAge: z.number().min(0).optional(),
  petAgeUnit: z.enum(['días', 'meses', 'años']).optional(),
  petWeight: z.number().min(0).optional(),
  petWeightUnit: z.enum(['kg', 'g']).optional(),
  petColor: z.string().optional(),
  petGender: z.enum(['Macho', 'Hembra']).optional(),
  
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  specialConditions: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional()
});

export const updateClientSchema = createClientSchema.partial();