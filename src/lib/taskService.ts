import { Task } from '../types/tasks';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    listId: 'my-day',
    title: 'Review weekly performance metrics and container SLA',
    completed: false,
    important: true,
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Work',
    notes: 'Verify CPU throttling and cloud egress latency in dashboard.',
    steps: [
      { id: 's1', title: 'Export Cloud Run logs', completed: true },
      { id: 's2', title: 'Check percentile p99 response times', completed: false }
    ],
    createdAt: Date.now() - 3600000
  },
  {
    id: '2',
    listId: 'my-day',
    title: 'Design review with Sarah Jenkins for navigation ribbons',
    completed: true,
    important: false,
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Work',
    createdAt: Date.now() - 7200000
  },
  {
    id: '3',
    listId: 'tasks',
    title: 'Review and merge dependabot security pull requests',
    completed: false,
    important: true,
    dueDate: '2026-09-18',
    category: 'Work',
    createdAt: Date.now() - 86400000
  }
];

const TASKS_KEY = 'outlook_test_tasks';
let inMemoryTasks: Task[] = [...INITIAL_TASKS];

function loadStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryTasks = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return inMemoryTasks;
}

function saveStoredTasks(tasks: Task[]): void {
  inMemoryTasks = tasks;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // silent fallback
  }
}

export async function fetchTasks(): Promise<Task[]> {
  return loadStoredTasks();
}

export async function insertTask(task: Task): Promise<Task | null> {
  const current = loadStoredTasks();
  const newTask: Task = {
    ...task,
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: task.createdAt || Date.now()
  };
  const updated = [newTask, ...current];
  saveStoredTasks(updated);
  return newTask;
}

export async function updateTask(
  id: string, 
  updates: Partial<{ completed: boolean; important: boolean; title: string; notes: string; dueDate?: string }>
): Promise<boolean> {
  const current = loadStoredTasks();
  const updated = current.map(t => {
    if (t.id !== id) return t;
    return {
      ...t,
      ...updates
    };
  });
  saveStoredTasks(updated);
  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  const current = loadStoredTasks();
  const updated = current.filter(t => t.id !== id);
  saveStoredTasks(updated);
  return true;
}
