// ============================================================
// CreateForEarn — Mock Data Layer
// ============================================================

// ---- Types ----
export interface SubredditStats {
  name: string;
  displayName: string;
  subscribers: number;
  activeUsers: number;
  postsToday: number;
  commentsToday: number;
  modQueueCount: number;
  reportsCount: number;
  healthScore: number;
  subscriberGrowth: number;
  engagementRate: number;
  createdAt: string;
  description: string;
  icon: string;
}

export interface ModQueueItem {
  id: string;
  type: 'post' | 'comment';
  title: string;
  content: string;
  author: string;
  authorKarma: number;
  subreddit: string;
  reportCount: number;
  reportReasons: string[];
  createdAt: string;
  score: number;
  commentCount?: number;
  status: 'pending' | 'approved' | 'removed' | 'spam';
  flair?: string;
}

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledAt: string;
  flair: string;
  status: 'scheduled' | 'posted' | 'draft' | 'failed';
  recurring: boolean;
  recurringInterval?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  karma: number;
  postKarma: number;
  commentKarma: number;
  joinDate: string;
  lastActive: string;
  postsCount: number;
  commentsCount: number;
  role: 'member' | 'moderator' | 'admin' | 'banned' | 'muted';
  warnings: number;
  flair?: string;
}

export interface PostFlair {
  id: string;
  text: string;
  color: string;
  bgColor: string;
  usageCount: number;
  emoji?: string;
}

export interface UserFlair {
  id: string;
  text: string;
  color: string;
  bgColor: string;
  editable: boolean;
}

export interface AutoModRule {
  id: string;
  name: string;
  description: string;
  type: 'spam' | 'content' | 'user' | 'flair' | 'custom';
  enabled: boolean;
  action: 'remove' | 'flag' | 'approve' | 'notify';
  conditions: string;
  triggerCount: number;
  lastTriggered: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'report' | 'ban' | 'approve' | 'remove' | 'join';
  user: string;
  description: string;
  timestamp: string;
  avatar: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
  value3?: number;
}

// ---- Helper Functions ----
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(0, 23), randomInt(0, 59));
  return d.toISOString();
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export { timeAgo };

function generateAvatar(seed: string): string {
  const colors = ['7c3aed', 'a855f7', '06b6d4', '10b981', 'f59e0b', 'ef4444', '3b82f6', 'ec4899'];
  const color = colors[seed.charCodeAt(0) % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=${color}&color=fff&size=40&bold=true`;
}

// ---- Mock Data ----

export const subredditStats: SubredditStats = {
  name: 'r/TechInnovators',
  displayName: 'Tech Innovators',
  subscribers: 487_293,
  activeUsers: 3_847,
  postsToday: 142,
  commentsToday: 2_891,
  modQueueCount: 23,
  reportsCount: 8,
  healthScore: 87,
  subscriberGrowth: 2.4,
  engagementRate: 4.7,
  createdAt: '2019-03-15',
  description: 'A community for tech enthusiasts discussing the latest innovations, AI breakthroughs, and the future of technology.',
  icon: '',
};

export const modQueueItems: ModQueueItem[] = [
  {
    id: 'mq1',
    type: 'post',
    title: 'Check out this amazing AI tool I built!',
    content: 'I spent the last 6 months building an AI-powered code reviewer that catches bugs before they reach production...',
    author: 'CodeWizard42',
    authorKarma: 15_420,
    subreddit: 'r/TechInnovators',
    reportCount: 3,
    reportReasons: ['Self-promotion', 'Spam'],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    score: 47,
    commentCount: 12,
    status: 'pending',
    flair: 'Project Showcase',
  },
  {
    id: 'mq2',
    type: 'comment',
    title: 'Re: Best programming language for beginners?',
    content: 'Just learn HTML, it\'s the best programming language and you\'ll be making $200k in no time...',
    author: 'TechBro99',
    authorKarma: 230,
    subreddit: 'r/TechInnovators',
    reportCount: 5,
    reportReasons: ['Misinformation', 'Low effort'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    score: -8,
    status: 'pending',
  },
  {
    id: 'mq3',
    type: 'post',
    title: 'Why quantum computing will replace classical computing by 2027',
    content: 'Based on my research and analysis of current quantum hardware capabilities, I believe we are approaching...',
    author: 'QuantumLeap',
    authorKarma: 42_100,
    subreddit: 'r/TechInnovators',
    reportCount: 1,
    reportReasons: ['Misleading title'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    score: 234,
    commentCount: 89,
    status: 'pending',
    flair: 'Discussion',
  },
  {
    id: 'mq4',
    type: 'post',
    title: 'FREE CRYPTO GIVEAWAY - Click here now!!!',
    content: 'Send me 1 ETH and I will send you back 10 ETH! Limited time offer...',
    author: 'CryptoKing2024',
    authorKarma: 1,
    subreddit: 'r/TechInnovators',
    reportCount: 12,
    reportReasons: ['Spam', 'Scam', 'Harassment'],
    createdAt: new Date(Date.now() - 900000).toISOString(),
    score: -42,
    commentCount: 3,
    status: 'pending',
    flair: undefined,
  },
  {
    id: 'mq5',
    type: 'comment',
    title: 'Re: Apple Vision Pro Review Thread',
    content: 'This is actually a really well-thought-out review. The spatial computing aspects are genuinely impressive...',
    author: 'AppleFanatic',
    authorKarma: 8_900,
    subreddit: 'r/TechInnovators',
    reportCount: 1,
    reportReasons: ['Off-topic'],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    score: 23,
    status: 'pending',
  },
  {
    id: 'mq6',
    type: 'post',
    title: 'I created a neural network that generates music — open source!',
    content: 'After months of training on MIDI data, my model can now compose original piano pieces that are indistinguishable...',
    author: 'MusicAI_Dev',
    authorKarma: 29_100,
    subreddit: 'r/TechInnovators',
    reportCount: 0,
    reportReasons: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    score: 512,
    commentCount: 67,
    status: 'pending',
    flair: 'Open Source',
  },
  {
    id: 'mq7',
    type: 'post',
    title: 'Controversial take: Rust is overhyped for web development',
    content: 'While Rust excels in systems programming, using it for web APIs when Go/Node exist is adding unnecessary complexity...',
    author: 'PragmaticDev',
    authorKarma: 12_300,
    subreddit: 'r/TechInnovators',
    reportCount: 2,
    reportReasons: ['Inflammatory'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    score: 156,
    commentCount: 203,
    status: 'pending',
    flair: 'Hot Take',
  },
  {
    id: 'mq8',
    type: 'comment',
    title: 'Re: Getting started with machine learning',
    content: 'You absolute idiot, just read the documentation. People like you shouldn\'t be in tech...',
    author: 'GateKeeper_X',
    authorKarma: 450,
    subreddit: 'r/TechInnovators',
    reportCount: 7,
    reportReasons: ['Harassment', 'Rude', 'Toxic behavior'],
    createdAt: new Date(Date.now() - 2700000).toISOString(),
    score: -31,
    status: 'pending',
  },
];

export const scheduledPosts: ScheduledPost[] = [
  {
    id: 'sp1',
    title: 'Weekly Discussion: What are you working on?',
    content: 'Share your current projects, ask for feedback, or discuss challenges you\'re facing this week.',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    flair: 'Weekly Thread',
    status: 'scheduled',
    recurring: true,
    recurringInterval: 'weekly',
  },
  {
    id: 'sp2',
    title: 'Monthly AMA: AI Researchers Panel',
    content: 'Join us for our monthly AMA with leading AI researchers from top universities.',
    scheduledAt: new Date(Date.now() + 259200000).toISOString(),
    flair: 'AMA',
    status: 'scheduled',
    recurring: true,
    recurringInterval: 'monthly',
  },
  {
    id: 'sp3',
    title: 'Community Spotlight: Best projects of June',
    content: 'Highlighting the top community projects submitted this month.',
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    flair: 'Community',
    status: 'scheduled',
    recurring: false,
  },
  {
    id: 'sp4',
    title: 'Tutorial Tuesday: Building a REST API with Go',
    content: 'Step-by-step guide to building a production-ready REST API using Go and Gin framework.',
    scheduledAt: new Date(Date.now() + 432000000).toISOString(),
    flair: 'Tutorial',
    status: 'draft',
    recurring: true,
    recurringInterval: 'weekly',
  },
  {
    id: 'sp5',
    title: 'Feedback Friday: Share your portfolio sites',
    content: 'Post your portfolio websites and get constructive feedback from the community.',
    scheduledAt: new Date(Date.now() + 345600000).toISOString(),
    flair: 'Feedback',
    status: 'scheduled',
    recurring: true,
    recurringInterval: 'weekly',
  },
  {
    id: 'sp6',
    title: 'Breaking: New JavaScript runtime announced',
    content: 'Discussion thread for the new JS runtime release — benchmarks, features, and migration guide.',
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    flair: 'News',
    status: 'posted',
    recurring: false,
  },
];

export const users: UserProfile[] = [
  { id: 'u1', username: 'CodeWizard42', avatar: generateAvatar('CodeWizard42'), karma: 15_420, postKarma: 9_200, commentKarma: 6_220, joinDate: '2021-06-12', lastActive: new Date(Date.now() - 300000).toISOString(), postsCount: 87, commentsCount: 432, role: 'member', warnings: 0, flair: 'Full-Stack Dev' },
  { id: 'u2', username: 'TechBro99', avatar: generateAvatar('TechBro99'), karma: 230, postKarma: 50, commentKarma: 180, joinDate: '2024-01-20', lastActive: new Date(Date.now() - 3600000).toISOString(), postsCount: 5, commentsCount: 23, role: 'member', warnings: 2 },
  { id: 'u3', username: 'QuantumLeap', avatar: generateAvatar('QuantumLeap'), karma: 42_100, postKarma: 30_100, commentKarma: 12_000, joinDate: '2020-02-08', lastActive: new Date(Date.now() - 7200000).toISOString(), postsCount: 203, commentsCount: 891, role: 'moderator', warnings: 0, flair: 'Quantum Computing' },
  { id: 'u4', username: 'CryptoKing2024', avatar: generateAvatar('CryptoKing2024'), karma: 1, postKarma: 1, commentKarma: 0, joinDate: '2024-06-30', lastActive: new Date(Date.now() - 900000).toISOString(), postsCount: 12, commentsCount: 3, role: 'banned', warnings: 5 },
  { id: 'u5', username: 'AppleFanatic', avatar: generateAvatar('AppleFanatic'), karma: 8_900, postKarma: 4_200, commentKarma: 4_700, joinDate: '2022-09-14', lastActive: new Date(Date.now() - 5400000).toISOString(), postsCount: 45, commentsCount: 312, role: 'member', warnings: 0, flair: 'Apple Ecosystem' },
  { id: 'u6', username: 'MusicAI_Dev', avatar: generateAvatar('MusicAI_Dev'), karma: 29_100, postKarma: 21_000, commentKarma: 8_100, joinDate: '2020-11-05', lastActive: new Date(Date.now() - 10800000).toISOString(), postsCount: 156, commentsCount: 567, role: 'member', warnings: 0, flair: 'AI/ML' },
  { id: 'u7', username: 'PragmaticDev', avatar: generateAvatar('PragmaticDev'), karma: 12_300, postKarma: 7_800, commentKarma: 4_500, joinDate: '2021-03-22', lastActive: new Date(Date.now() - 14400000).toISOString(), postsCount: 92, commentsCount: 341, role: 'member', warnings: 0, flair: 'Backend Dev' },
  { id: 'u8', username: 'GateKeeper_X', avatar: generateAvatar('GateKeeper_X'), karma: 450, postKarma: 100, commentKarma: 350, joinDate: '2023-07-18', lastActive: new Date(Date.now() - 2700000).toISOString(), postsCount: 8, commentsCount: 67, role: 'muted', warnings: 4 },
  { id: 'u9', username: 'AlgoQueen', avatar: generateAvatar('AlgoQueen'), karma: 67_500, postKarma: 45_000, commentKarma: 22_500, joinDate: '2019-08-01', lastActive: new Date(Date.now() - 600000).toISOString(), postsCount: 312, commentsCount: 1_290, role: 'admin', warnings: 0, flair: 'Community Admin' },
  { id: 'u10', username: 'RustEvangelist', avatar: generateAvatar('RustEvangelist'), karma: 34_200, postKarma: 22_100, commentKarma: 12_100, joinDate: '2020-05-17', lastActive: new Date(Date.now() - 1800000).toISOString(), postsCount: 178, commentsCount: 789, role: 'moderator', warnings: 0, flair: ' Rustacean' },
  { id: 'u11', username: 'DataNerd_42', avatar: generateAvatar('DataNerd_42'), karma: 19_800, postKarma: 11_200, commentKarma: 8_600, joinDate: '2021-01-10', lastActive: new Date(Date.now() - 4200000).toISOString(), postsCount: 98, commentsCount: 445, role: 'member', warnings: 1, flair: 'Data Science' },
  { id: 'u12', username: 'DevOps_Guru', avatar: generateAvatar('DevOps_Guru'), karma: 23_400, postKarma: 15_600, commentKarma: 7_800, joinDate: '2020-09-28', lastActive: new Date(Date.now() - 9000000).toISOString(), postsCount: 134, commentsCount: 612, role: 'moderator', warnings: 0, flair: 'DevOps' },
];

export const postFlairs: PostFlair[] = [
  { id: 'pf1', text: 'Discussion', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', usageCount: 1_234, emoji: '' },
  { id: 'pf2', text: 'Project Showcase', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', usageCount: 876, emoji: '' },
  { id: 'pf3', text: 'Tutorial', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', usageCount: 654, emoji: '' },
  { id: 'pf4', text: 'News', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', usageCount: 1_567, emoji: '' },
  { id: 'pf5', text: 'Question', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', usageCount: 2_341, emoji: '' },
  { id: 'pf6', text: 'Open Source', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)', usageCount: 432, emoji: '' },
  { id: 'pf7', text: 'Hot Take', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', usageCount: 789, emoji: '' },
  { id: 'pf8', text: 'AMA', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', usageCount: 98, emoji: '' },
  { id: 'pf9', text: 'Weekly Thread', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', usageCount: 52, emoji: '' },
  { id: 'pf10', text: 'Meta', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', usageCount: 167, emoji: '' },
];

export const userFlairs: UserFlair[] = [
  { id: 'uf1', text: 'Full-Stack Dev', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', editable: false },
  { id: 'uf2', text: 'AI/ML', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', editable: false },
  { id: 'uf3', text: 'DevOps', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', editable: false },
  { id: 'uf4', text: 'Mobile Dev', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', editable: false },
  { id: 'uf5', text: 'Data Science', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', editable: true },
  { id: 'uf6', text: 'Community Admin', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', editable: false },
  { id: 'uf7', text: 'Custom Flair', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', editable: true },
];

export const autoModRules: AutoModRule[] = [
  {
    id: 'am1', name: 'Spam Filter', description: 'Automatically remove posts from accounts younger than 7 days with less than 10 karma',
    type: 'spam', enabled: true, action: 'remove',
    conditions: 'account_age < 7 days AND karma < 10', triggerCount: 342, lastTriggered: new Date(Date.now() - 1200000).toISOString(), createdAt: '2023-01-15',
  },
  {
    id: 'am2', name: 'Slur Filter', description: 'Flag and remove comments containing slurs or hate speech keywords',
    type: 'content', enabled: true, action: 'remove',
    conditions: 'body contains [banned_words_list]', triggerCount: 89, lastTriggered: new Date(Date.now() - 7200000).toISOString(), createdAt: '2023-01-15',
  },
  {
    id: 'am3', name: 'Link Spam Detection', description: 'Flag posts with more than 3 external links for manual review',
    type: 'spam', enabled: true, action: 'flag',
    conditions: 'external_links > 3', triggerCount: 56, lastTriggered: new Date(Date.now() - 14400000).toISOString(), createdAt: '2023-03-20',
  },
  {
    id: 'am4', name: 'Karma Threshold', description: 'Auto-flag posts from users with negative karma',
    type: 'user', enabled: true, action: 'flag',
    conditions: 'author_karma < 0', triggerCount: 23, lastTriggered: new Date(Date.now() - 28800000).toISOString(), createdAt: '2023-05-10',
  },
  {
    id: 'am5', name: 'Title Length Check', description: 'Remove posts with titles shorter than 10 characters',
    type: 'content', enabled: false, action: 'remove',
    conditions: 'title_length < 10', triggerCount: 112, lastTriggered: new Date(Date.now() - 43200000).toISOString(), createdAt: '2023-06-01',
  },
  {
    id: 'am6', name: 'Flair Requirement', description: 'Require all posts to have a flair — notify poster if missing',
    type: 'flair', enabled: true, action: 'notify',
    conditions: 'post_flair == null', triggerCount: 678, lastTriggered: new Date(Date.now() - 3600000).toISOString(), createdAt: '2023-02-28',
  },
  {
    id: 'am7', name: 'Duplicate Post Detection', description: 'Flag posts with titles matching existing posts from the last 48 hours',
    type: 'content', enabled: true, action: 'flag',
    conditions: 'title_similarity > 85% within 48h', triggerCount: 34, lastTriggered: new Date(Date.now() - 21600000).toISOString(), createdAt: '2023-08-15',
  },
  {
    id: 'am8', name: 'Self-Promo Limit', description: 'Limit self-promotional posts to 1 per user per week',
    type: 'custom', enabled: true, action: 'remove',
    conditions: 'author_promo_posts > 1 within 7d', triggerCount: 45, lastTriggered: new Date(Date.now() - 36000000).toISOString(), createdAt: '2023-09-01',
  },
];

export const activityFeed: ActivityItem[] = [
  { id: 'a1', type: 'post', user: 'MusicAI_Dev', description: 'submitted a new post: "Neural network music generator"', timestamp: new Date(Date.now() - 120000).toISOString(), avatar: generateAvatar('MusicAI_Dev') },
  { id: 'a2', type: 'comment', user: 'QuantumLeap', description: 'commented on "Quantum computing future"', timestamp: new Date(Date.now() - 300000).toISOString(), avatar: generateAvatar('QuantumLeap') },
  { id: 'a3', type: 'report', user: 'System', description: 'New report on post by CryptoKing2024: Spam', timestamp: new Date(Date.now() - 600000).toISOString(), avatar: generateAvatar('System') },
  { id: 'a4', type: 'approve', user: 'AlgoQueen', description: 'approved post: "Rust vs Go benchmark results"', timestamp: new Date(Date.now() - 900000).toISOString(), avatar: generateAvatar('AlgoQueen') },
  { id: 'a5', type: 'ban', user: 'RustEvangelist', description: 'banned user CryptoKing2024: Spam/Scam', timestamp: new Date(Date.now() - 1200000).toISOString(), avatar: generateAvatar('RustEvangelist') },
  { id: 'a6', type: 'join', user: 'NewDev_2024', description: 'joined the community', timestamp: new Date(Date.now() - 1800000).toISOString(), avatar: generateAvatar('NewDev_2024') },
  { id: 'a7', type: 'remove', user: 'DevOps_Guru', description: 'removed comment by GateKeeper_X: Harassment', timestamp: new Date(Date.now() - 2400000).toISOString(), avatar: generateAvatar('DevOps_Guru') },
  { id: 'a8', type: 'post', user: 'PragmaticDev', description: 'submitted a new post: "Rust is overhyped"', timestamp: new Date(Date.now() - 3000000).toISOString(), avatar: generateAvatar('PragmaticDev') },
  { id: 'a9', type: 'comment', user: 'CodeWizard42', description: 'commented on "AI code reviewer showcase"', timestamp: new Date(Date.now() - 3600000).toISOString(), avatar: generateAvatar('CodeWizard42') },
  { id: 'a10', type: 'join', user: 'FreshCoder', description: 'joined the community', timestamp: new Date(Date.now() - 4200000).toISOString(), avatar: generateAvatar('FreshCoder') },
];

// ---- Chart Data Generators ----

export function generateSubscriberGrowth(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let base = 475_000;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 12; i++) {
    base += randomInt(800, 2500);
    data.push({ label: months[i], value: base });
  }
  return data;
}

export function generateEngagementData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let w = 0; w < 4; w++) {
    for (const day of days) {
      data.push({
        label: `W${w + 1} ${day}`,
        value: randomInt(80, 200),   // posts
        value2: randomInt(400, 1200), // comments
        value3: randomInt(2000, 8000), // upvotes
      });
    }
  }
  return data;
}

export function generateHourlyActivity(): number[][] {
  const data: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      // Simulate realistic activity patterns
      let base = 20;
      if (hour >= 9 && hour <= 17) base = 60; // Work hours
      if (hour >= 12 && hour <= 14) base = 80; // Lunch peak
      if (hour >= 19 && hour <= 22) base = 90; // Evening peak
      if (hour >= 0 && hour <= 6) base = 10;   // Night
      if (day >= 5) base *= 0.7; // Weekend
      row.push(Math.floor(base + randomInt(-15, 25)));
    }
    data.push(row);
  }
  return data;
}

export function generateTrafficSources(): { label: string; value: number; color: string }[] {
  return [
    { label: 'Direct', value: 35, color: '#7c3aed' },
    { label: 'Reddit Home', value: 28, color: '#a855f7' },
    { label: 'Search', value: 18, color: '#06b6d4' },
    { label: 'External Links', value: 12, color: '#10b981' },
    { label: 'Other', value: 7, color: '#f59e0b' },
  ];
}

export function generateDailyStats(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      value: randomInt(100, 250),  // posts
      value2: randomInt(1500, 4000), // comments
    });
  }
  return data;
}

export const topPosts = [
  { title: 'I built a full OS in Rust — here\'s what I learned', author: 'RustEvangelist', score: 4_521, comments: 342, flair: 'Project Showcase', createdAt: '2d ago' },
  { title: 'OpenAI just announced GPT-5 — megathread', author: 'AlgoQueen', score: 3_892, comments: 1_203, flair: 'News', createdAt: '5d ago' },
  { title: 'The complete guide to system design interviews', author: 'QuantumLeap', score: 3_214, comments: 187, flair: 'Tutorial', createdAt: '1w ago' },
  { title: 'Why I left FAANG after 10 years', author: 'PragmaticDev', score: 2_987, comments: 456, flair: 'Discussion', createdAt: '3d ago' },
  { title: 'React vs Vue vs Svelte: 2024 benchmark results', author: 'CodeWizard42', score: 2_654, comments: 891, flair: 'Discussion', createdAt: '6d ago' },
];

export const topContributors = [
  { username: 'AlgoQueen', karma: 67_500, posts: 312, comments: 1_290, avatar: generateAvatar('AlgoQueen') },
  { username: 'QuantumLeap', karma: 42_100, posts: 203, comments: 891, avatar: generateAvatar('QuantumLeap') },
  { username: 'RustEvangelist', karma: 34_200, posts: 178, comments: 789, avatar: generateAvatar('RustEvangelist') },
  { username: 'MusicAI_Dev', karma: 29_100, posts: 156, comments: 567, avatar: generateAvatar('MusicAI_Dev') },
  { username: 'DevOps_Guru', karma: 23_400, posts: 134, comments: 612, avatar: generateAvatar('DevOps_Guru') },
];
