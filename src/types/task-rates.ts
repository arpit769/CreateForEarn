export interface TaskRateItem {
  post: number;
  comment: number;
  upvote: number;
  reshare: number;
  follow: number;
  crosspost?: number;
  like?: number;
  subscribe?: number;
  comment_reply?: number;
  repost?: number;
  quote_post?: number;
  bookmark?: number;
  answer?: number;
  follow_topic?: number;
  share?: number;
  save?: number;
  reel_view?: number;
  story_view?: number;
  connect?: number;
}

export interface ClientTaskRates {
  reddit: TaskRateItem;
  youtube: TaskRateItem;
  x: TaskRateItem;
  instagram: TaskRateItem;
  linkedin: TaskRateItem;
  quora: TaskRateItem;
  custom_addup?: number;
}

export const DEFAULT_TASK_RATES: ClientTaskRates = {
  reddit: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  youtube: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  x: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  instagram: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  linkedin: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  quora: { post: 10, comment: 5, upvote: 1, reshare: 3, crosspost: 3, follow: 1 },
  custom_addup: 0
};

