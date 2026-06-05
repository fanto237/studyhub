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
  isTotpEnabled: boolean;
  totpEnabledAt: string | null;
  karmaScore: number;
  createdAt: string;
  latestPosts: CurrentUserLatestPost[];
}

export interface UpdateCurrentUserRequest {
  username: string;
  fullName: string;
  privateEmail: string;
}

export interface PublicUserLatestPost {
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

export interface PublicUserProfileResponse {
  id: string;
  username: string;
  universityName: string;
  isVerified: boolean;
  karmaScore: number;
  createdAt: string;
  totalUploads: number;
  totalUpvotesReceived: number;
  latestPosts: PublicUserLatestPost[];
}
