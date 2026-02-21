import React, { useState, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { useTaskStore } from '../store/taskStore';
import { usePresenceStore } from '../store/presenceStore';
import { socket } from '../socket/client';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const optimisticUpdate = useTaskStore(state => state.optimisticUpdate);
  const optimisticDelete = useTaskStore(state => state.optimisticDelete);

  const isTemporary = task.id.startsWith('temp-');

  // Get raw editing tasks and filter manually
  const allEditingTasks = usePresenceStore(state => state.editingTasks);
  
  const usersForThisTask = useMemo(
    () => {
      if (!allEditingTasks) return [];
      return allEditingTasks
        .filter(e => e && e.taskId === task.id)
        .map(e => e.username);
    },
    [allEditingTasks, task.id]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (editing) {
      socket.emit('task:startEdit', { taskId: task.id });
    } else {
      socket.emit('task:stopEdit', { taskId: task.id });
    }
    return () => {
      if (editing) {
        socket.emit('task:stopEdit', { taskId: task.id });
      }
    };
  }, [editing, task.id]);

  const handleSave = () => {
    optimisticUpdate(task.id, { title: editTitle, description: editDescription });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    optimisticDelete(task.id);
  };

  if (editing) {
    return (
      <div className="task-card editing" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          placeholder="Title"
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={e => setEditDescription(e.target.value)}
          placeholder="Description"
          rows={2}
        />
        <div className="task-actions">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-header">
        <h3>{task.title}</h3>
        <button onClick={handleDeleteClick} className="delete-btn" aria-label="Delete">
          ✕
        </button>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}

      {usersForThisTask.length > 0 && (
        <div className="editing-indicator">
          ✎ {usersForThisTask.join(', ')} {usersForThisTask.length === 1 ? 'is' : 'are'} editing
        </div>
      )}

      {isTemporary ? (
        <span className="syncing-indicator">Syncing...</span>
      ) : (
        <button onClick={handleEditClick} className="edit-btn">
          Edit
        </button>
      )}
    </div>
  );
}