import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useTaskStore } from '../store/taskStore';
import Column from './Column';
import { getRankBetween } from '../utils/rank';

const columns: { id: 'todo' | 'inprogress' | 'done'; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function Board() {
  const tasks = useTaskStore(state => state.tasks);
  const optimisticUpdate = useTaskStore(state => state.optimisticUpdate);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id.toString();
    let newColumn: 'todo' | 'inprogress' | 'done' = activeTask.column;
    let newRank = activeTask.rank;

    if (overId.startsWith('column-')) {
      const targetColumn = overId.replace('column-', '') as 'todo' | 'inprogress' | 'done';
      newColumn = targetColumn;
      const columnTasks = tasks
        .filter(t => t.column === newColumn)
        .sort((a, b) => a.rank.localeCompare(b.rank));
      const lastRank = columnTasks.length ? columnTasks[columnTasks.length - 1].rank : null;
      newRank = getRankBetween(lastRank, null);
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;
      newColumn = overTask.column;
      let columnTasks = tasks
        .filter(t => t.column === newColumn)
        .sort((a, b) => a.rank.localeCompare(b.rank));
      if (newColumn === activeTask.column) {
        columnTasks = columnTasks.filter(t => t.id !== activeTask.id);
      }
      const overIndex = columnTasks.findIndex(t => t.id === overId);
      if (overIndex === -1) return;
      const prevRank = overIndex > 0 ? columnTasks[overIndex - 1].rank : null;
      const nextRank = overTask.rank;
      newRank = getRankBetween(prevRank, nextRank);
    }

    optimisticUpdate(activeTask.id, { column: newColumn, rank: newRank });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="board-container">
        {columns.map(col => (
          <Column key={col.id} column={col.id} title={col.title} />
        ))}
      </div>
    </DndContext>
  );
}