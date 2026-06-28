export type FeedSort = 'trending' | 'top' | 'new';

export type VoteValue = 'up' | 'down' | null;

export type VoteRequestValue = 'up' | 'down' | 'remove';

export type ReportPostReason =
  | 'spam'
  | 'copyright'
  | 'abusive'
  | 'wrong-content'
  | 'other';

export interface PostFeedUser {
  id: string;
  username: string;
  fullName: string;
}

export interface PostFeedItem {
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
  user: PostFeedUser;
  currentVote: VoteValue;
}

export interface GetPostsResponse {
  items: PostFeedItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetPostsParams {
  sort: FeedSort;
  page: number;
  pageSize: number;
  search?: string | null;
  tags?: string[];
}

export interface CreatePostRequest {
  file: File;
  title: string;
  description?: string | null;
  tags: string[];
}

export interface CreatePostResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  storageUrl: string;
  tags: string[];
  createdAt: string;
  message: string;
}

export interface GeneratePostMetadataSuggestionsRequest {
  file: File;
  title?: string | null;
}

export interface GeneratePostMetadataSuggestionsResponse {
  title: string | null;
  description: string | null;
  tags: string[];
  detectedLanguage?: string | null;
  languageConfidence?: number | null;
  warnings: string[];
  message: string;
  quota?: AiMetadataQuota | null;
}

export interface AiMetadataQuota {
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface PostDetailUser {
  id: string;
  username: string;
  fullName: string;
}

export interface PostDetailComment {
  id: string;
  parentCommentId: string | null;
  text: string;
  createdAt: string;
  user: PostDetailUser;
}

export interface GetPostResponse {
  id: string;
  title: string;
  description: string | null;
  storageUrl: string;
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
  tags: string[];
  user: PostDetailUser;
  comments: PostDetailComment[];
  currentVote: VoteValue;
}

export interface VotePostResponse {
  postId: string;
  upvotes: number;
  downvotes: number;
  score: number;
  currentVote: VoteValue;
  message: string;
}

export interface DownloadPostResponse {
  postId: string;
  downloadUrl: string;
  fileName: string | null;
  message: string;
}

export interface ReportPostRequest {
  reason: ReportPostReason;
  details?: string | null;
}

export interface ReportPostResponse {
  postId: string;
  reportCount: number;
  isHidden: boolean;
  message: string;
}
