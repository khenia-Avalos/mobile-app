import { Router } from 'express';
import { 
  getOwners, 
  getOwner, 
  createOwner, 
  updateOwner, 
  deleteOwner 
} from '../controllers/owner.controller.js';
import { validateToken } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validator.middleware.js';

const router = Router();
router.use(validateToken);

router.get('/owners', getOwners);
router.get('/owners/:id', getOwner);
router.post('/owners', createOwner);
router.put('/owners/:id', updateOwner);
router.delete('/owners/:id', deleteOwner);

export default router;