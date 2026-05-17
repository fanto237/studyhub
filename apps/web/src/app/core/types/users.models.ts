export interface CurrentUserLatestPost {
  id: string;
  title: string;
  description: string | null;
  storageUrl: string;
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: string;
  commentCount: number;
  tags: string[];
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  fullName: string;
  privateEmail: string;
  schoolEmail: string;
  universityName: string;
  role: number | string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  karmaScore: number;
  createdAt: string;
  latestPosts: CurrentUserLatestPost[];
}
