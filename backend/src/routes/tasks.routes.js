import {Router} from 'express'
import { validateToken } from "../middlewares/validateToken.js";
import {
    getTask,
    getTasks,
    createTasks,
    deleteTasks,
    updateTasks,
} from "../controllers/tasks.controller.js"
import { validateSchema } from '../middlewares/validator.middleware.js';    
import { createTaskSchema } from '../schemas/task.schema.js';

const router = Router()
router.use(validateToken)

router.get('/tasks', getTasks)
router.post('/tasks', validateSchema(createTaskSchema), createTasks)
router.get('/tasks/:id', getTask)
router.put('/tasks/:id', updateTasks)
router.delete('/tasks/:id', deleteTasks)


export default router