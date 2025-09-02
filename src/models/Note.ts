import pool from '../config/database';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export class NoteModel {
  // Get all notes for a specific user
  static async getByUserId(userId: number): Promise<Note[]> {
    try {
      const query = `
        SELECT id, user_id, title, content, created_at, updated_at 
        FROM notes 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      throw new Error('Failed to fetch notes');
    }
  }

  // Create a new note
  static async create(userId: number, noteData: CreateNoteData): Promise<Note> {
    try {
      const query = `
        INSERT INTO notes (user_id, title, content, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, user_id, title, content, created_at, updated_at
      `;
      const values = [userId, noteData.title, noteData.content];
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create note');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  // Update an existing note
  static async update(noteId: number, userId: number, updateData: UpdateNoteData): Promise<Note> {
    try {
      // Build dynamic query based on what fields are being updated
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramCount}`);
        values.push(updateData.title);
        paramCount++;
      }

      if (updateData.content !== undefined) {
        updateFields.push(`content = $${paramCount}`);
        values.push(updateData.content);
        paramCount++;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add WHERE conditions
      values.push(noteId, userId);
      const whereClause = `WHERE id = $${paramCount} AND user_id = $${paramCount + 1}`;

      const query = `
        UPDATE notes 
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING id, user_id, title, content, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Note not found or unauthorized');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  // Delete a note
  static async delete(noteId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM notes 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      const result = await pool.query(query, [noteId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Note not found or unauthorized');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  // Get a specific note by ID (for validation)
  static async getById(noteId: number, userId: number): Promise<Note | null> {
    try {
      const query = `
        SELECT id, user_id, title, content, created_at, updated_at 
        FROM notes 
        WHERE id = $1 AND user_id = $2
      `;
      const result = await pool.query(query, [noteId, userId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Error fetching note by ID:', error);
      throw new Error('Failed to fetch note');
    }
  }
}