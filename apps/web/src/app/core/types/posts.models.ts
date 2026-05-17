export type FeedSort = 'trending' | 'top' | 'new';

export type VoteValue = 'up' | 'down' | null;

export type VoteRequestValue = 'up' | 'down' | 'remove';

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
