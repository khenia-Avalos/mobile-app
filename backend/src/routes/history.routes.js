import { Router } from 'express';
import { 
  getClientHistory,
  createHistoryRecord,
  getHistoryRecord,
  updateHistoryRecord,
  getHistorySummary
} from '../controllers/history.controller.js';
import { validateToken } from '../middlewares/validateToken.js';

const router = Router();
router.use(validateToken);

router.get('/history/client/:clientId', getClientHistory);
router.get('/history/summary/:clientId?', getHistorySummary);
router.get('/history/:id', getHistoryRecord);
router.post('/history', createHistoryRecord);
router.put('/history/:id', updateHistoryRecord);

export default router;