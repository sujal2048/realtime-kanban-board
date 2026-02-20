import React, { Component } from 'react';
import type { ErrorInfo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTaskStore } from '../store/taskStore';
import TaskCard from './TaskCard';
import { getRankBetween } from '../utils/rank';

class TaskCardErrorBoundary extends Component<{ children: React.ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in TaskCard:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="task-card error">Failed to load task</div>;
    }
    return this.props.children;
  }
}

interface ColumnProps {
  column: 'todo' | 'inprogress' | 'done';
  title: string;
}

export default function Column({ column, title }: ColumnProps) {
  const tasks = useTaskStore(state => state.tasks);
  const columnTasks = tasks
    .filter(t => t.column === column)
    .sort((a, b) => a.rank.localeCompare(b.rank));

  const { setNodeRef } = useDroppable({ id: `column-${column}` });

  const handleAddTask = () => {
    const lastRank = columnTasks.length ? columnTasks[columnTasks.length - 1].rank : null;
    const newRank = getRankBetween(lastRank, null);
    useTaskStore.getState().optimisticCreate({
      title: 'New Task',
      description: '',
      column,
      rank: newRank,
    });
  };

  return (
    <div className="column">
      <h2>{title}</h2>
      <div ref={setNodeRef} className="task-list">
        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {columnTasks.map(task => (
            <TaskCardErrorBoundary key={task.id}>
              <TaskCard task={task} />
            </TaskCardErrorBoundary>
          ))}
        </SortableContext>
      </div>
      <button onClick={handleAddTask} className="add-task-btn">
        + Add Task
      </button>
    </div>
  );
}