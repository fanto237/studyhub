import { type PostDetailComment, type PostDetailUser } from './posts.models';

export interface GetPostCommentsResponse {
  comments: PostDetailComment[];
}

export interface CreateCommentRequest {
  text: string;
  parentCommentId?: string | null;
}

export interface CreateCommentResponse extends PostDetailComment {
  postId: string;
  user: PostDetailUser;
}

export interface UpdateCommentRequest {
  text: string;
}

export interface UpdateCommentResponse extends PostDetailComment {
  postId: string;
  user: PostDetailUser;
}
