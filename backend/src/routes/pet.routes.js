import { Router } from 'express';
import { 
  getPets, 
  getPet, 
  createPet, 
  updatePet, 
  deletePet,
  addVaccination 
} from '../controllers/pet.controller.js';
import { validateToken } from '../middlewares/validateToken.js';

const router = Router();
router.use(validateToken);

router.get('/pets', getPets);
router.get('/pets/:id', getPet);
router.post('/pets', createPet);
router.put('/pets/:id', updatePet);
router.delete('/pets/:id', deletePet);
router.post('/pets/:id/vaccinations', addVaccination);

export default router;