import express from 'express';
import { NotesController } from '../controllers/noteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected (require authentication)
router.use(authenticateToken);

router.get('/', NotesController.getNotes);
router.post('/', NotesController.createNote);
router.put('/:id', NotesController.updateNote);
router.delete('/:id', NotesController.deleteNote);

export default router;