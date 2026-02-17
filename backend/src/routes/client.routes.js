import { Router } from 'express';
import { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient,
  getClientStats 
} from '../controllers/client.controller.js';
import { validateToken } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js';

const router = Router();
router.use(validateToken);

router.get('/clients', getClients);
router.get('/clients/stats', getClientStats);
router.get('/clients/:id', getClient);
router.post('/clients', validateSchema(createClientSchema), createClient);
router.put('/clients/:id', validateSchema(updateClientSchema), updateClient);
router.delete('/clients/:id', deleteClient);

export default router;