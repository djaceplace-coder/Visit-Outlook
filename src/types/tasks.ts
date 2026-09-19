export type TaskListId = 'my-day' | 'important' | 'planned' | 'flagged' | 'tasks';

export interface TaskStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  listId: TaskListId;
  title: string;
  completed: boolean;
  important?: boolean;
  dueDate?: string; // YYYY-MM-DD
  reminder?: string;
  notes?: string;
  steps?: TaskStep[];
  category?: 'Work' | 'Personal' | 'Urgent' | 'Follow-up';
  createdAt: number;
}
