/**
 * Helper to return Outlook category badge styles for labels & tags
 */
export function getCategoryBadgeStyle(category?: string): string {
  if (!category) return '';
  const lower = category.toLowerCase();
  
  if (lower.includes('green') || lower.includes('project') || lower.includes('client')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300';
  }
  if (lower.includes('purple') || lower.includes('design') || lower.includes('ux')) {
    return 'bg-purple-50 text-purple-800 border-purple-300';
  }
  if (lower.includes('orange') || lower.includes('operations') || lower.includes('security')) {
    return 'bg-amber-50 text-amber-800 border-amber-300';
  }
  if (lower.includes('red') || lower.includes('urgent') || lower.includes('critical') || lower.includes('finance')) {
    return 'bg-rose-50 text-rose-800 border-rose-300';
  }
  if (lower.includes('yellow') || lower.includes('review') || lower.includes('planning')) {
    return 'bg-amber-100 text-amber-900 border-amber-400';
  }
  if (lower.includes('teal') || lower.includes('engineering') || lower.includes('dev')) {
    return 'bg-teal-50 text-teal-800 border-teal-300';
  }
  if (lower.includes('billing') || lower.includes('invoice') || lower.includes('sales')) {
    return 'bg-indigo-50 text-indigo-800 border-indigo-300';
  }
  
  return 'bg-blue-50 text-blue-800 border-blue-300';
}
