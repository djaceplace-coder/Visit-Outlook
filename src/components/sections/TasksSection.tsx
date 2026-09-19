import { useState, useMemo, useEffect, type FormEvent, type MouseEvent } from 'react';
import {
  Sun,
  Star,
  Calendar,
  Flag,
  CheckSquare,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  Trash2,
  X,
  Clock,
  Tag,
  ListPlus,
  AlignLeft,
  Menu
} from 'lucide-react';
import { Task, TaskListId, TaskStep } from '../../types/tasks';
import { 
  fetchTasks, 
  insertTask, 
  updateTask as updateTaskInService, 
  deleteTask as deleteTaskFromService, 
  INITIAL_TASKS 
} from '../../lib/taskService';

export interface TasksSectionProps {
  searchQuery?: string;
}

export function TasksSection({ searchQuery = '' }: TasksSectionProps = {}) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeList, setActiveList] = useState<TaskListId>('my-day');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('1');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks()
      .then(loadedTasks => {
        if (loadedTasks && loadedTasks.length > 0) {
          setTasks(loadedTasks);
        }
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
      });
  }, []);

  const lists: { id: TaskListId; label: string; icon: any; color: string }[] = [
    { id: 'my-day', label: 'My Day', icon: Sun, color: 'text-[#0078D4]' },
    { id: 'important', label: 'Important', icon: Star, color: 'text-amber-500' },
    { id: 'planned', label: 'Planned', icon: Calendar, color: 'text-[#107C41]' },
    { id: 'flagged', label: 'Flagged email', icon: Flag, color: 'text-red-500' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-[#0078D4]' }
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Global Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (activeList === 'my-day') {
        const todayStr = new Date().toISOString().split('T')[0];
        return t.listId === 'my-day' || t.dueDate === todayStr;
      }
      if (activeList === 'important') return t.important;
      if (activeList === 'planned') return !!t.dueDate;
      if (activeList === 'flagged') return t.listId === 'flagged';
      if (activeList === 'tasks') return true;
      return t.listId === activeList;
    });
  }, [tasks, activeList, searchQuery]);

  const uncompletedTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      listId: activeList,
      title: newTaskTitle.trim(),
      completed: false,
      important: activeList === 'important',
      dueDate: activeList === 'my-day' ? new Date().toISOString().split('T')[0] : undefined,
      createdAt: Date.now()
    };

    setTasks([newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
    setNewTaskTitle('');

    insertTask(newTask).then(inserted => {
      if (inserted && inserted.id !== newTask.id) {
        setTasks(prev => prev.map(t => t.id === newTask.id ? inserted : t));
        if (selectedTaskId === newTask.id) setSelectedTaskId(inserted.id);
      }
    }).catch(console.error);
  };

  const toggleTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const newCompleted = !target.completed;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t));
    updateTaskInService(taskId, { completed: newCompleted }).catch(console.error);
  };

  const toggleImportant = (taskId: string, e: MouseEvent) => {
    e.stopPropagation();
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const newImportant = !target.important;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, important: newImportant } : t));
    updateTaskInService(taskId, { important: newImportant }).catch(console.error);
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    deleteTaskFromService(taskId).catch(console.error);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const updateSelectedTask = (patch: Partial<Task>) => {
    if (!selectedTaskId) return;
    setTasks(tasks.map(t => t.id === selectedTaskId ? { ...t, ...patch } : t));
    updateTaskInService(selectedTaskId, patch).catch(console.error);
  };

  const handleAddStep = (e: FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim() || !selectedTask) return;

    const newStep: TaskStep = {
      id: `step_${Date.now()}`,
      title: newStepTitle.trim(),
      completed: false
    };

    updateSelectedTask({
      steps: [...(selectedTask.steps || []), newStep]
    });
    setNewStepTitle('');
  };

  const toggleStep = (stepId: string) => {
    if (!selectedTask) return;
    const updated = (selectedTask.steps || []).map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
    updateSelectedTask({ steps: updated });
  };

  const deleteStep = (stepId: string) => {
    if (!selectedTask) return;
    const updated = (selectedTask.steps || []).filter(s => s.id !== stepId);
    updateSelectedTask({ steps: updated });
  };

  const activeMeta = lists.find(l => l.id === activeList);
  const Icon = activeMeta?.icon || CheckSquare;

  return (
    <div className="flex h-full bg-[#FAFAFA] text-[#242424] overflow-hidden select-none relative">
      {/* Mobile backdrop for lists sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Lists Sidebar (drawer on mobile) */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 md:w-60 border-r border-gray-200 bg-white flex flex-col py-4 px-2 flex-shrink-0 shadow-xl md:shadow-none transition-transform duration-200 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="px-3 pb-3 mb-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0078D4] text-white flex items-center justify-center">
              <CheckSquare size={14} />
            </div>
            <span className="font-semibold text-xs text-gray-900 tracking-wide">To Do</span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-xs md:hidden"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {lists.map(list => {
            const ListIcon = list.icon;
            const isActive = activeList === list.id;
            const count = tasks.filter(t => {
              if (t.completed) return false;
              if (list.id === 'my-day') return t.listId === 'my-day' || t.dueDate === new Date().toISOString().split('T')[0];
              if (list.id === 'important') return t.important;
              if (list.id === 'planned') return !!t.dueDate;
              if (list.id === 'flagged') return t.listId === 'flagged';
              return true;
            }).length;

            return (
              <button
                key={list.id}
                type="button"
                onClick={() => {
                  setActiveList(list.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50/80 text-[#0078D4] font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ListIcon size={16} className={list.color} />
                  <span>{list.label}</span>
                </div>
                {count > 0 && (
                  <span className="text-[11px] text-gray-400 font-mono">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Task Stream */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F8] overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 rounded-xs md:hidden"
                title="Open list menu"
              >
                <Menu size={18} />
              </button>
              <Icon size={24} className={activeMeta?.color} />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{activeMeta?.label}</h1>
                <p className="text-xs text-gray-500">
                  {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddTask} className="mb-6">
            <div className="relative bg-white border border-gray-200 shadow-2xs rounded-xs flex items-center focus-within:border-[#0078D4] transition-colors">
              <div className="pl-3 text-gray-400">
                <Plus size={18} />
              </div>
              <input
                type="text"
                placeholder="Add a task"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-3 text-xs bg-transparent focus:outline-hidden text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="mr-2 px-3 py-1 bg-[#0078D4] text-white text-xs font-semibold rounded-xs disabled:opacity-40 hover:bg-[#005A9E] transition-colors"
              >
                Add
              </button>
            </div>
          </form>

          {/* Tasks List */}
          <div className="flex-1 space-y-2">
            {uncompletedTasks.map(task => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3 bg-white border rounded-xs flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all ${
                    isSelected ? 'border-[#0078D4] ring-1 ring-[#0078D4]/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                      className="text-gray-400 hover:text-[#0078D4] transition-colors flex-shrink-0"
                    >
                      <Circle size={18} strokeWidth={1.8} />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[#0078D4]">
                            <Calendar size={11} />
                            <span>{task.dueDate}</span>
                          </span>
                        )}
                        {task.steps && task.steps.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span>{task.steps.filter(s => s.completed).length} of {task.steps.length}</span>
                          </span>
                        )}
                        {task.category && (
                          <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-xs">
                            {task.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleImportant(task.id, e)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-300 hover:text-amber-500 transition-colors flex-shrink-0"
                    title={task.important ? 'Remove importance' : 'Mark as important'}
                  >
                    <Star
                      size={16}
                      className={task.important ? 'text-amber-500 fill-amber-500' : ''}
                    />
                  </button>
                </div>
              );
            })}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-2 transition-colors"
                >
                  {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Completed ({completedTasks.length})</span>
                </button>

                {showCompleted && (
                  <div className="space-y-1.5">
                    {completedTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3 bg-gray-50/70 border border-gray-200 rounded-xs flex items-center justify-between gap-3 opacity-75 cursor-pointer hover:bg-gray-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                            className="w-4.5 h-4.5 rounded-full bg-[#0078D4] flex items-center justify-center text-white flex-shrink-0"
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>
                          <span className="text-xs text-gray-500 line-through truncate">{task.title}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => toggleImportant(task.id, e)}
                          className="p-1 text-gray-300 hover:text-amber-500"
                        >
                          <Star
                            size={16}
                            className={task.important ? 'text-amber-500 fill-amber-500' : ''}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Right Task Details Drawer */}
      {selectedTask && (
        <div className="fixed md:static inset-y-0 right-0 z-40 md:z-auto w-full max-w-sm md:w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0 shadow-2xl md:shadow-none animate-in slide-in-from-right duration-150">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Task Details</span>
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              className="p-1 hover:bg-gray-100 rounded-xs text-gray-500"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Completion & Title */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTask(selectedTask.id)}
                className="mt-0.5 text-gray-400 hover:text-[#0078D4] transition-colors flex-shrink-0"
              >
                {selectedTask.completed ? (
                  <div className="w-5 h-5 rounded-full bg-[#0078D4] flex items-center justify-center text-white">
                    <Check size={13} strokeWidth={3} />
                  </div>
                ) : (
                  <Circle size={20} strokeWidth={1.8} />
                )}
              </button>
              <textarea
                rows={2}
                value={selectedTask.title}
                onChange={(e) => updateSelectedTask({ title: e.target.value })}
                className="flex-1 text-xs font-semibold text-gray-900 bg-transparent border-0 focus:ring-1 focus:ring-[#0078D4] p-1 rounded-xs resize-none"
              />
            </div>

            {/* Checklist / Subtasks */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <ListPlus size={14} className="text-gray-500" />
                <span>Next Steps ({selectedTask.steps?.length || 0})</span>
              </div>

              <div className="space-y-1">
                {(selectedTask.steps || []).map(step => (
                  <div key={step.id} className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 rounded-xs text-xs">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {step.completed ? (
                        <Check size={13} className="text-[#0078D4] flex-shrink-0" />
                      ) : (
                        <Circle size={13} className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${step.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {step.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStep(step.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddStep} className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  placeholder="Add next step"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#0078D4] focus:outline-hidden rounded-xs"
                />
              </form>
            </div>

            {/* Due Date & Reminders */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-700">Schedule</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xs text-xs">
                  <span className="flex items-center gap-2 text-gray-700">
                    <Calendar size={14} className="text-gray-500" />
                    Due Date
                  </span>
                  <input
                    type="date"
                    value={selectedTask.dueDate || ''}
                    onChange={(e) => updateSelectedTask({ dueDate: e.target.value || undefined })}
                    className="text-xs bg-transparent border border-gray-200 rounded-xs px-1.5 py-0.5 focus:outline-hidden focus:border-[#0078D4]"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xs text-xs">
                  <span className="flex items-center gap-2 text-gray-700">
                    <Tag size={14} className="text-gray-500" />
                    Category
                  </span>
                  <select
                    value={selectedTask.category || ''}
                    onChange={(e) => updateSelectedTask({ category: (e.target.value || undefined) as any })}
                    className="text-xs bg-transparent border border-gray-200 rounded-xs px-1.5 py-0.5 focus:outline-hidden focus:border-[#0078D4]"
                  >
                    <option value="">None</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
                <AlignLeft size={14} className="text-gray-500" />
                <span>Notes</span>
              </div>
              <textarea
                rows={4}
                value={selectedTask.notes || ''}
                onChange={(e) => updateSelectedTask({ notes: e.target.value })}
                placeholder="Add notes..."
                className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xs focus:bg-white focus:border-[#0078D4] focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
            <span className="font-mono text-[10px]">Created {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
            <button
              type="button"
              onClick={() => deleteTask(selectedTask.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-xs transition-colors flex items-center gap-1"
              title="Delete task"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
