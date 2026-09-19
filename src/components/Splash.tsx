import { EnvelopeLoader } from './EnvelopeLoader';
import { IconLoader } from './IconLoader';

export function Splash({ 
  mode = 'envelope', 
  onComplete = () => {}, 
  userEmail 
}: { 
  mode?: 'envelope' | 'icon'; 
  onComplete?: () => void; 
  userEmail?: string; 
}) {
  if (mode === 'icon') {
    return <IconLoader onComplete={onComplete} userEmail={userEmail} />;
  }
  return <EnvelopeLoader onComplete={onComplete} />;
}
