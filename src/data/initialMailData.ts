import { EmailMessage, FolderItem } from '../types/mail';

export const INITIAL_FOLDERS: FolderItem[] = [
  { id: 'inbox', name: 'Inbox', unreadCount: 4, system: true },
  { id: 'drafts', name: 'Drafts', unreadCount: 2, system: true },
  { id: 'sent', name: 'Sent Items', unreadCount: 0, system: true },
  { id: 'archive', name: 'Archive', unreadCount: 0, system: true },
  { id: 'deleted', name: 'Deleted Items', unreadCount: 1, system: true },
  { id: 'junk', name: 'Junk Email', unreadCount: 3, system: true },
  { id: 'notes', name: 'Notes', unreadCount: 0, system: true },
  {
    id: 'projects',
    name: 'Projects',
    unreadCount: 2,
    children: [
      { id: 'proj-q4', name: 'Q4 Launch', unreadCount: 1, parentId: 'projects' },
      {
        id: 'proj-design',
        name: 'Design System',
        unreadCount: 1,
        parentId: 'projects',
        children: [
          { id: 'proj-design-icons', name: 'Icons & Tokens', unreadCount: 0, parentId: 'proj-design' }
        ]
      }
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Invoices',
    unreadCount: 0,
    children: [
      { id: 'fin-tax', name: 'Tax 2026', unreadCount: 0, parentId: 'finance' }
    ]
  }
];

export const INITIAL_MESSAGES: EmailMessage[] = [
  {
    id: 'msg-1',
    threadId: 'th-1',
    folder: 'inbox',
    tab: 'focused',
    from: { name: 'Microsoft Outlook Team', email: 'welcome@outlook.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Welcome to your upgraded Outlook workspace',
    preview: 'Explore your new three-pane client, command ribbon, and streamlined productivity layout...',
    body: `Hello Alex,

Welcome to your redesigned Outlook client! We've focused on speed, clarity, and tactile efficiency.

Key upgrades in this release:
• Precision three-pane workspace with collapsible folder and reading panes
• Full command ribbon with Home, View, and Help modes
• Fluid conversation threading and multi-selection
• Direct keyboard shortcuts for rapid triage

If you have feedback or ideas, select Help > Support or test our keyboard shortcuts at any time by pressing '?'.

Best regards,
The Outlook Product Team`,
    date: '10:42 AM',
    timestamp: Date.now() - 1000 * 60 * 30,
    read: false,
    flagged: true,
    pinned: true,
    importance: 'high',
    category: 'Blue'
  },
  {
    id: 'msg-2',
    threadId: 'th-2',
    folder: 'inbox',
    tab: 'focused',
    from: { name: 'Sarah Jenkins', email: 's.jenkins@meridian.io' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    cc: [{ name: 'Marcus Chen', email: 'm.chen@meridian.io' }],
    subject: 'Invitation: Q4 Product Roadmap & Executive Review Deck',
    preview: 'Attached is the revised keynote deck including the updated timeline for November beta...',
    body: `Hi Alex,

Attached is the updated presentation for tomorrow's board sync. I have integrated Marcus' comments on the revised timeline and resource allocation for the November beta.

Could you review slides 8 through 14 before 4 PM today?

Thanks,
Sarah Jenkins
VP Product | Meridian`,
    date: '9:15 AM',
    timestamp: Date.now() - 1000 * 60 * 120,
    read: false,
    flagged: true,
    category: 'Green',
    hasAttachments: true,
    attachments: [
      { id: 'att-1', name: 'Q4_Roadmap_Review_v3.pdf', size: '3.4 MB', type: 'pdf' },
      { id: 'att-2', name: 'Beta_Milestone_Matrix.xlsx', size: '420 KB', type: 'sheet' }
    ],
    meetingInvite: {
      title: 'Q4 Product Roadmap & Executive Review Sync',
      start: 'Tomorrow at 10:00 AM',
      end: 'Tomorrow at 11:30 AM',
      location: 'Microsoft Teams Meeting',
      isTeams: true,
      status: 'pending',
      organizer: { name: 'Sarah Jenkins', email: 's.jenkins@meridian.io' }
    }
  },
  {
    id: 'msg-3',
    threadId: 'th-2',
    folder: 'inbox',
    tab: 'focused',
    from: { name: 'Marcus Chen', email: 'm.chen@meridian.io' },
    to: [
      { name: 'Sarah Jenkins', email: 's.jenkins@meridian.io' },
      { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }
    ],
    subject: 'Re: Q4 Product Roadmap & Executive Review Deck',
    preview: 'Slide 11 looks great now. Let us double check the infrastructure budget lines...',
    body: `Sarah, Alex,

Slide 11 looks great now. Let's make sure the engineering allocation accounts for container warm-up latency. I'm available for a 15-minute sync after lunch if needed.

Marcus`,
    date: '8:48 AM',
    timestamp: Date.now() - 1000 * 60 * 150,
    read: true,
    flagged: false,
    category: 'Yellow'
  },
  {
    id: 'msg-4',
    threadId: 'th-3',
    folder: 'inbox',
    tab: 'focused',
    from: { name: 'Elena Rostova', email: 'elena.r@designcraft.co' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Design tokens & icon library package ready for test',
    preview: 'The monochrome glyph export and SVG symbols have been merged into the main design repo...',
    body: `Hi Alex,

We just published version 2.4 of the design tokens. All primary UI surfaces have been calibrated for crisp contrast and sharp corner geometry as requested.

Attached is a preview export showing the full icon grid and density scale.

Let me know if any assets need adjustments!

Warmly,
Elena`,
    date: 'Yesterday',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    read: false,
    flagged: false,
    category: 'Purple',
    hasAttachments: true,
    attachments: [
      { id: 'att-3', name: 'Outlook_Token_Spec_2026.pdf', size: '1.8 MB', type: 'pdf' },
      { id: 'att-4', name: 'Icon_Sheet_Preview.png', size: '890 KB', type: 'img' }
    ]
  },
  {
    id: 'msg-5',
    threadId: 'th-4',
    folder: 'inbox',
    tab: 'focused',
    from: { name: 'David Kim', email: 'david.k@cloudinfra.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Incident Post-Mortem: September 12 Latency Spike',
    preview: 'Root cause was traced to a downstream caching misconfiguration during rolling restart...',
    body: `Team,

The post-mortem report for the latency spike on September 12 is finalized. Root cause was an uncached DNS lookup loop during container initialization. Mitigations have been deployed and verified across all clusters.

Full analysis is in the internal incident log.

Best,
David`,
    date: 'Sep 14',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    read: true,
    flagged: false,
    category: 'Orange'
  },
  {
    id: 'msg-6',
    threadId: 'th-5',
    folder: 'inbox',
    tab: 'other',
    from: { name: 'GitHub Notifications', email: 'notifications@github.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: '[outlook-client] Pull Request #148: Add keyboard shortcut navigation',
    preview: 'User @dev-dan commented on pull request #148: "The ArrowUp and ArrowDown listeners feel very smooth..."',
    body: `Pull Request #148: Add keyboard shortcut navigation

Changes proposed:
- Global key listener for 'c' (compose), 'r' (reply), 'e' (archive), '#' (delete)
- Arrow key focus cycling in message list
- Escape key listener for dialog dismissal

View PR on GitHub: https://github.com/organization/outlook-client/pull/148`,
    date: 'Sep 15',
    timestamp: Date.now() - 1000 * 60 * 60 * 30,
    read: true,
    flagged: false,
    category: 'Teal'
  },
  {
    id: 'msg-7',
    threadId: 'th-6',
    folder: 'inbox',
    tab: 'other',
    from: { name: 'Substack Weekly', email: 'digest@substack.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Issue #94: The Return of Utilitarian Software Design',
    preview: 'Why high-density, sharp-cornered interfaces are winning back professionals in 2026...',
    body: `The Return of Utilitarian Software Design

In this issue:
- Why modern knowledge workers crave fast, low-friction desktop layouts
- The ergonomics of 3-pane email architectures
- Keyboard-first command palettes and split action bars

Read the full dispatch online.`,
    date: 'Sep 13',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    read: true,
    flagged: false,
    category: 'News'
  },
  {
    id: 'msg-8',
    threadId: 'th-7',
    folder: 'inbox',
    tab: 'other',
    from: { name: 'Stripe Billing', email: 'invoices@stripe.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Your invoice for Cloud Run Services (#INV-2026-09)',
    preview: 'Amount paid: $48.20. Thank you for your continued business...',
    body: `Invoice INV-2026-09
Status: Paid in full
Amount: $48.20
Payment method: Visa ending in 4242

Receipt and breakdown can be downloaded from your customer portal.`,
    date: 'Sep 11',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    read: true,
    flagged: false,
    category: 'Billing',
    hasAttachments: true,
    attachments: [
      { id: 'att-5', name: 'Invoice_INV-2026-09.pdf', size: '115 KB', type: 'pdf' }
    ]
  },
  {
    id: 'msg-9',
    threadId: 'th-8',
    folder: 'drafts',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Dr. Rebecca Stone', email: 'r.stone@medresearch.org' }],
    subject: '[Draft] Questions regarding clinical trial methodology',
    preview: 'Dear Dr. Stone, I reviewed the preliminary publication and had two questions regarding statistical cohort sizing...',
    body: `Dear Dr. Stone,

I reviewed the preliminary publication and had two questions regarding statistical cohort sizing for phase 2. When you have a moment next week, could we discuss?

Best,
Alex`,
    date: 'Draft',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    read: true,
    flagged: false
  },
  {
    id: 'msg-10',
    threadId: 'th-9',
    folder: 'drafts',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Support Team', email: 'support@cloudvendor.com' }],
    subject: '[Draft] API Rate Limit Increase Request',
    preview: 'Hello support, we are preparing for a high-volume load test on Friday and would like to request...',
    body: `Hello support,

We are preparing for a high-volume load test on Friday and would like to request a temporary quota increase on our project.

Details:
Cluster ID: prod-europe-west2-a
Target RPS: 1,500

Thanks!`,
    date: 'Draft',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    read: true,
    flagged: false
  },
  {
    id: 'msg-11',
    threadId: 'th-10',
    folder: 'sent',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Sarah Jenkins', email: 's.jenkins@meridian.io' }],
    subject: 'Feedback on Q4 Timeline proposal',
    preview: 'Sarah, I took a look and agreed that moving the release candidate by 10 days gives QA adequate buffer...',
    body: `Sarah,

I took a look and agreed that moving the release candidate by 10 days gives QA adequate buffer. Let's proceed with this schedule.

Alex`,
    date: 'Sep 15',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    read: true,
    flagged: false
  },
  {
    id: 'msg-12',
    threadId: 'th-11',
    folder: 'sent',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Marcus Chen', email: 'm.chen@meridian.io' }],
    subject: 'Infrastructure specifications confirmed',
    preview: 'Thanks Marcus. The multi-region standby configuration is confirmed with the operations team...',
    body: `Thanks Marcus. The multi-region standby configuration is confirmed with the operations team.

Alex`,
    date: 'Sep 14',
    timestamp: Date.now() - 1000 * 60 * 60 * 40,
    read: true,
    flagged: false
  },
  {
    id: 'msg-13',
    threadId: 'th-12',
    folder: 'sent',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Accounting', email: 'accounts@company.com' }],
    subject: 'Travel Expense Report - September Client Visit',
    preview: 'Please find attached the receipts and boarding passes from last weeks on-site workshop...',
    body: `Hello Accounting,

Please find attached the receipts and boarding passes from last week's on-site workshop in London.

Thanks,
Alex`,
    date: 'Sep 12',
    timestamp: Date.now() - 1000 * 60 * 60 * 90,
    read: true,
    flagged: false,
    hasAttachments: true,
    attachments: [
      { id: 'att-6', name: 'London_Travel_Receipts.pdf', size: '2.1 MB', type: 'pdf' }
    ]
  },
  {
    id: 'msg-14',
    threadId: 'th-13',
    folder: 'junk',
    tab: 'other',
    from: { name: 'Prize Notification Center', email: 'claims@unsolicited-rewards.biz' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Claim your $1,000 gift card immediately',
    preview: 'Your account was randomly selected for the autumn prize giveaway. Click to verify your identity...',
    body: `Congratulations! Click the link below to confirm your mailing address and claim your award.`,
    date: 'Sep 15',
    timestamp: Date.now() - 1000 * 60 * 60 * 25,
    read: false,
    flagged: false
  },
  {
    id: 'msg-15',
    threadId: 'th-14',
    folder: 'deleted',
    tab: 'other',
    from: { name: 'Old Webinar Host', email: 'webinars@marketing-hub.net' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Recording available: How to optimize cloud costs in 2025',
    preview: 'Thank you for attending the session. Here is your on-demand replay link...',
    body: `Thank you for attending the session. Here is your on-demand replay link.`,
    date: 'Sep 10',
    timestamp: Date.now() - 1000 * 60 * 60 * 150,
    read: true,
    flagged: false
  },
  {
    id: 'msg-16',
    threadId: 'th-15',
    folder: 'proj-q4',
    tab: 'focused',
    from: { name: 'Danielle Cooper', email: 'danielle@meridian.io' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Q4 Launch Readiness Checklist & Go-Live Gates',
    preview: 'All teams have signed off on the staging deployment. Release candidate branch cut tomorrow...',
    body: `Hi Alex,
    
We are on track for the Q4 launch window. All dependencies on the authentication service have passed verification tests.

Please review the final go-live checklist attached and approve the staging dry-run.

Best,
Danielle`,
    date: 'Sep 15',
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
    read: false,
    flagged: true,
    category: 'Green',
    hasAttachments: true,
    attachments: [
      { id: 'att-7', name: 'Q4_Launch_Checklist.pdf', size: '320 KB', type: 'pdf' }
    ]
  },
  {
    id: 'msg-17',
    threadId: 'th-16',
    folder: 'proj-design',
    tab: 'focused',
    from: { name: 'Elena Rostova', email: 'elena.r@designcraft.co' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Design System V2: Component Specifications',
    preview: 'Here are the updated specs for button states, command bars, and sharp-cornered modal dialogs...',
    body: `Alex,
    
The component audit is complete. We have unified the padding scales and borders across all desktop controls.

Let me know if you want to inspect the tokens Figma file.

Elena`,
    date: 'Sep 14',
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
    read: false,
    flagged: false,
    category: 'Purple'
  },
  {
    id: 'msg-18',
    threadId: 'th-17',
    folder: 'proj-design-icons',
    tab: 'focused',
    from: { name: 'Elena Rostova', email: 'elena.r@designcraft.co' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Exported SVG glyphs for mail, calendar, and task panes',
    preview: 'Full monochrome vector set matching 16px and 20px optical viewboxes...',
    body: `Hi Alex,
    
Attaching the final SVG export for the rail and command ribbon icons. All lines strictly 1.5px stroke weight.

Cheers!`,
    date: 'Sep 13',
    timestamp: Date.now() - 1000 * 60 * 60 * 60,
    read: true,
    flagged: false,
    hasAttachments: true,
    attachments: [
      { id: 'att-8', name: 'Outlook_Glyphs_v2.zip', size: '1.2 MB', type: 'zip' }
    ]
  },
  {
    id: 'msg-19',
    threadId: 'th-18',
    folder: 'fin-tax',
    tab: 'focused',
    from: { name: 'Corporate Accounting', email: 'tax-filings@meridian.io' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: '2026 Estimated Tax Documentation & State Apportionment',
    preview: 'Documents filed for Q3 state corporate tax apportionment and withholdings...',
    body: `Alex,
    
Your quarterly corporate tax summary has been updated and archived in the corporate finance portal.

Accounting Department`,
    date: 'Sep 08',
    timestamp: Date.now() - 1000 * 60 * 60 * 190,
    read: true,
    flagged: false
  },
  {
    id: 'msg-20',
    threadId: 'th-19',
    folder: 'notes',
    tab: 'focused',
    from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Sprint Retrospective Notes & Engineering Action Items',
    preview: 'Action items from sprint 42: improve folder drag-and-drop feedback, enforce sharp card borders...',
    body: `Sprint 42 Retrospective:
- Drag-and-drop feedback in folder pane: highlight target folder on dragover.
- Keep unread counts dynamically derived from message state.
- Keyboard navigation (arrows, c, e, #).
- Sharp corner styling throughout interface.`,
    date: 'Sep 12',
    timestamp: Date.now() - 1000 * 60 * 60 * 95,
    read: true,
    flagged: true
  },
  {
    id: 'msg-21',
    threadId: 'th-20',
    folder: 'archive',
    tab: 'focused',
    from: { name: 'AWS Cloud Architecture', email: 'arch@cloudinfra.org' },
    to: [{ name: 'Alex Bennett', email: 'alex.bennett@outlook.com' }],
    subject: 'Archived: Multi-region DNS failover test results',
    preview: 'Synthetics testing completed with zero packet drop across all transatlantic transit nodes...',
    body: `Synthetics testing completed with zero packet drop across all transatlantic transit nodes. Document archived for compliance.`,
    date: 'Aug 29',
    timestamp: Date.now() - 1000 * 60 * 60 * 400,
    read: true,
    flagged: false
  }
];
