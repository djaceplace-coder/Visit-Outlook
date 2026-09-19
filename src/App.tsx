/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SignIn } from './components/SignIn';
import { AppShell, Section } from './components/AppShell';
import { InboxSection } from './components/sections/InboxSection';
import { CalendarSection } from './components/sections/CalendarSection';
import { PeopleSection } from './components/sections/PeopleSection';
import { TasksSection } from './components/sections/TasksSection';
import { AppsSection } from './components/sections/AppsSection';
import { SettingsPanel, OutlookSettings } from './components/mail/SettingsPanel';
import { AdvancedSearchModal, AdvancedSearchFilters } from './components/mail/AdvancedSearchModal';
import { INITIAL_FOLDERS } from './data/initialMailData';
import { EnvelopeLoader } from './components/EnvelopeLoader';
import { IconLoader } from './components/IconLoader';
import { TestEnvironmentPage } from './components/TestEnvironmentPage';

type AppState = 'entry-loader' | 'signin' | 'post-signin-loader' | 'app';

function checkIsTestPath(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/test') ||
    window.location.hash === '#/test' ||
    window.location.hash.startsWith('#/test')
  );
}

export default function App() {
  const [isTestRoute, setIsTestRoute] = useState(checkIsTestPath);
  const [appState, setAppState] = useState<AppState>('entry-loader');
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('outlook_test_user_email') || 'alex.bennett@outlook.com';
  });
  const [currentSection, setCurrentSection] = useState<Section>('inbox');
  const [isFolderPaneOpen, setIsFolderPaneOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [prefillCompose, setPrefillCompose] = useState<{ to: string; subject?: string } | null>(null);
  const [prefillEvent, setPrefillEvent] = useState<{ title?: string; attendees?: string[] } | null>(null);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<OutlookSettings>({
    themeColor: '#0078D4',
    isDarkMode: false,
    density: 'normal',
    readingPanePosition: 'right',
    enableFocusedInbox: true,
    groupByConversation: true,
    autoRepliesEnabled: false,
    autoRepliesText: 'Thank you for reaching out. I am currently away from the office with limited access to email and will reply upon return.'
  });

  // Advanced search state
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters | null>(null);

  // Synchronize URL routing for /test
  useEffect(() => {
    const handleLocationChange = () => {
      setIsTestRoute(checkIsTestPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Synchronize dynamic theme accent and dark mode
  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand-cobalt', settings.themeColor);
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeColor, settings.isDarkMode]);

  const navigateToTest = () => {
    try {
      window.history.pushState({}, '', '/test');
    } catch {}
    setIsTestRoute(true);
  };

  const navigateToApp = (email?: string) => {
    if (email) {
      setUserEmail(email);
      try {
        localStorage.setItem('outlook_test_user_email', email);
      } catch {}
      setAppState('app');
    }
    try {
      window.history.pushState({}, '', '/');
    } catch {}
    setIsTestRoute(false);
  };

  const handleSignOut = () => {
    setAppState('signin');
  };

  // Dedicated /test page route
  if (isTestRoute) {
    return (
      <TestEnvironmentPage 
        currentUserEmail={userEmail} 
        onNavigateToApp={navigateToApp}
        onUserSwitch={(newEmail) => {
          setUserEmail(newEmail);
          try {
            localStorage.setItem('outlook_test_user_email', newEmail);
          } catch {}
        }}
      />
    );
  }

  if (appState === 'entry-loader') {
    return <EnvelopeLoader onComplete={() => setAppState('signin')} />;
  }

  if (appState === 'signin') {
    return (
      <SignIn
        onSignIn={(email) => {
          if (email) {
            setUserEmail(email);
            try {
              localStorage.setItem('outlook_test_user_email', email);
            } catch {}
          }
          setAppState('post-signin-loader');
        }}
      />
    );
  }

  if (appState === 'post-signin-loader') {
    return (
      <IconLoader
        userEmail={userEmail}
        onComplete={() => setAppState('app')}
      />
    );
  }

  return (
    <>
      <AppShell 
        currentSection={currentSection} 
        onNavigate={setCurrentSection}
        onSignOut={handleSignOut}
        onNavigateToTest={navigateToTest}
        isFolderPaneOpen={isFolderPaneOpen}
        onToggleFolderPane={() => setIsFolderPaneOpen(prev => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={userEmail}
        onOpenAdvancedSearch={() => {
          setIsAdvancedSearchOpen(true);
          setIsSettingsOpen(false);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsAdvancedSearchOpen(false);
        }}
      >
        {currentSection === 'inbox' && (
          <InboxSection 
            isFolderPaneOpen={isFolderPaneOpen}
            onToggleFolderPane={() => setIsFolderPaneOpen(prev => !prev)}
            searchQuery={searchQuery}
            advancedFilters={advancedFilters}
            onClearAdvancedFilters={() => setAdvancedFilters(null)}
            density={settings.density}
            onDensityChange={(d) => setSettings(prev => ({ ...prev, density: d }))}
            readingPanePosition={settings.readingPanePosition}
            onReadingPanePositionChange={(p) => setSettings(prev => ({ ...prev, readingPanePosition: p }))}
            enableFocusedInbox={settings.enableFocusedInbox}
            onNavigateToSection={setCurrentSection}
            prefillCompose={prefillCompose}
            onClearPrefillCompose={() => setPrefillCompose(null)}
            autoRepliesEnabled={settings.autoRepliesEnabled}
            onDisableAutoReplies={() => setSettings(prev => ({ ...prev, autoRepliesEnabled: false }))}
            onOpenSettings={() => setIsSettingsOpen(true)}
            accountEmail={userEmail || 'alex.bennett@outlook.com'}
          />
        )}
        {currentSection === 'calendar' && (
          <CalendarSection 
            prefillEvent={prefillEvent}
            onClearPrefillEvent={() => setPrefillEvent(null)}
            searchQuery={searchQuery}
          />
        )}
        {currentSection === 'people' && (
          <PeopleSection
            searchQuery={searchQuery}
            onSendEmailTo={(email) => {
              setPrefillCompose({ to: email });
              setCurrentSection('inbox');
            }}
            onScheduleMeetingWith={(contact) => {
              setPrefillEvent({
                title: `Meeting with ${contact.firstName} ${contact.lastName}`,
                attendees: [contact.email]
              });
              setCurrentSection('calendar');
            }}
          />
        )}
        {currentSection === 'tasks' && <TasksSection searchQuery={searchQuery} />}
        {currentSection === 'apps' && <AppsSection searchQuery={searchQuery} />}
      </AppShell>

      {/* Settings Flyout */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings(prev => ({ ...prev, ...newVals }))}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        folders={INITIAL_FOLDERS}
        currentFolderId="inbox"
        initialFilters={advancedFilters || undefined}
        onApplyFilters={(filters) => {
          setAdvancedFilters(filters);
          if (currentSection !== 'inbox') {
            setCurrentSection('inbox');
          }
        }}
        onResetFilters={() => setAdvancedFilters(null)}
      />
    </>
  );
}
