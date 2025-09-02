import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NoteModel, CreateNoteData, UpdateNoteData } from '../models/Note';

export class NotesController {
  // Get all notes for user
  static async getNotes(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;

      const notes = await NoteModel.getByUserId(userId);

      res.status(200).json({
        success: true,
        data: { notes },
      });
    } catch (error) {
      console.error('❌ Get notes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notes.',
      });
    }
  }

  // Create new note
  static async createNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { title, content } = req.body;

      // Validate input
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required.',
        });
      }

      if (title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Title must be at least 3 characters long.',
        });
      }

      if (content.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Content must be at least 10 characters long.',
        });
      }

      const noteData: CreateNoteData = {
        title: title.trim(),
        content: content.trim(),
      };

      const newNote = await NoteModel.create(userId, noteData);

      res.status(201).json({
        success: true,
        message: 'Note created successfully!',
        data: { note: newNote },
      });
    } catch (error) {
      console.error('❌ Create note error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create note.',
      });
    }
  }

  // Update note
  static async updateNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const noteId = parseInt(req.params.id);
      const { title, content } = req.body;

      // Validate noteId
      if (isNaN(noteId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid note ID.',
        });
      }

      // Check if note exists and belongs to user
      const existingNote = await NoteModel.getById(noteId, userId);
      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: 'Note not found or unauthorized.',
        });
      }

      // Validate input if provided
      const updateData: UpdateNoteData = {};
      
      if (title !== undefined) {
        if (title.trim().length < 3) {
          return res.status(400).json({
            success: false,
            message: 'Title must be at least 3 characters long.',
          });
        }
        updateData.title = title.trim();
      }

      if (content !== undefined) {
        if (content.trim().length < 10) {
          return res.status(400).json({
            success: false,
            message: 'Content must be at least 10 characters long.',
          });
        }
        updateData.content = content.trim();
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update.',
        });
      }

      const updatedNote = await NoteModel.update(noteId, userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Note updated successfully!',
        data: { note: updatedNote },
      });
    } catch (error) {
      console.error('❌ Update note error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update note.',
      });
    }
  }

  // Delete note
  static async deleteNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const noteId = parseInt(req.params.id);

      // Validate noteId
      if (isNaN(noteId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid note ID.',
        });
      }

      // Check if note exists and belongs to user
      const existingNote = await NoteModel.getById(noteId, userId);
      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: 'Note not found or unauthorized.',
        });
      }

      await NoteModel.delete(noteId, userId);

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully!',
      });
    } catch (error) {
      console.error('❌ Delete note error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete note.',
      });
    }
  }
}