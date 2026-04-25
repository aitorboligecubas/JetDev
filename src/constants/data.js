export const issues = [
  { id: 'EVENT-27', type: 'N', title: 'Send promotional emails', time: '8 minutes ago', tag: 'Star', avatar: { initials: 'CP', color: '#FF318C' } },
  { id: 'EVENT-30', type: 'N', title: 'Coordinate with venue staff', time: '32 minutes ago', tag: 'Star', avatar: { initials: 'JL', color: '#0060FF' } },
  { id: 'EVENT-29', type: 'N', title: 'Order catering supplies', time: '1 hour ago', tag: null, avatar: { initials: 'AB', color: '#59A869' } },
  { id: 'EVENT-28', type: 'N', title: 'Conduct a rehearsal meeting', time: '2 hours ago', tag: 'Star', avatar: { initials: 'CP', color: '#FF318C' } },
  { id: 'EVENT-31', type: 'C', title: 'Confirm guest list', time: '3 hours ago', tag: null, avatar: { initials: 'FH', color: '#F5760A' } },
  { id: 'EVENT-33', type: 'N', title: 'Soundcheck with speakers', time: '4 hours ago', tag: null, avatar: { initials: 'JL', color: '#0060FF' } },
];

export const epics = [
  { name: 'Invitations', tag: 'EVENT-2', collapsed: true, cards: [] },
  { name: "Prepare 'PM Basics'", tag: null, collapsed: false, cards: [{ id: 'EVENT-28', title: 'Conduct a rehearsal meeting', tags: [], borderColor: '#59A869' }] },
  { name: 'Coercion to Unit', tag: 'DEV-1', collapsed: false, cards: [
    { id: 'DEV-5', title: 'No coercion to Unit when function literal is a receiver', tags: ['Bug', 'Kotlin'], borderColor: '#59A869' },
    { id: 'DEV-8', title: '', tags: [], borderColor: '#E5E5E5' },
  ]},
];

export const activities = [
  { user: 'Carry Parker', initials: 'CP', color: '#FF318C', time: 'almost 2 years ago', text: 'Description changed:', link: 'Details' },
  { user: null, initials: '', color: '', time: '4 Jul 2022 00:27', text: 'Description changed:', link: 'Details' },
  { user: 'Carry Parker', initials: 'CP', color: '#FF318C', time: '1d 2h ago', text: '@John Luis looks good! Thank you! 😊 TNX 👍', link: null },
  { user: 'John Luis', initials: 'JL', color: '#0060FF', time: 'almost 2 years ago', text: 'please check new updates of the API spec.', link: null },
];

export const notifications = [
  {
    id: 1,
    avatar: { initials: 'FH', color: '#FF318C' },
    name: 'Felicity Hutchinson',
    action: 'commented 16 minutes ago',
    text: "Hi @JThor! Thank you for your query, and I'm sorry to hear you are having problems accessing your account. We are looking into this and will come back to you soon. Kind regards, Felicity Hutchinson Support Engineer",
    link: 'View comment',
    emoji: '😊',
    tag: null,
  },
  {
    id: 2,
    tag: { id: 'MKT-257', label: 'Clients list for case stu...' },
    avatar: { initials: 'JL', color: '#0060FF' },
    name: 'John Luis',
    action: 'commented 18 minutes ago',
    text: 'Hi @Carry.Parker, updates n...',
    link: 'View comment',
    emoji: null,
  },
  {
    id: 3,
    tag: { id: 'LAC-9', label: 'Create PO for supplier' },
    avatar: { initials: 'JL', color: '#6B6B6B' },
    name: 'John Luis',
    action: 'updated 18 minutes ago',
    text: '',
    link: null,
    emoji: null,
  },
];

export const kbData = [
  { name: 'Customer support', expanded: false, items: [] },
  { name: 'Design Dept', expanded: false, items: [] },
  {
    name: 'Event Management Dept', expanded: true,
    items: [
      { name: 'My documents', locked: true, count: 1 },
      { name: 'Public events', count: 3 },
      { name: 'Public knowledge base', count: 7 },
      { name: 'Internal documentation', locked: true, count: 12 },
      { name: 'Text styling options' },
      { name: 'Getting Started with KB in YouTrack' },
    ],
  },
];

export const quickPrompts = [
  { emoji: '⚡', label: 'REST API', prompt: 'A REST API for a restaurant booking system with endpoints for reservations, menus, and user authentication' },
  { emoji: '🌐', label: 'Web App', prompt: 'A modern web application for managing team tasks with real-time collaboration features' },
  { emoji: '🔧', label: 'CLI Tool', prompt: 'A CLI tool for batch processing CSV files with filtering, sorting, and export capabilities' },
];

export const generationSteps = [
  { label: 'Understanding your idea', delay: 0 },
  { label: 'Junie generating project', delay: 1500 },
  { label: 'Deploying to AWS', delay: 3000 },
  { label: 'Ready for preview', delay: 4500 },
];
