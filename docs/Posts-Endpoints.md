Necessary MVP endpoints

- POST /api/posts — upload/create post with PDF + metadata
- GET /api/posts — list feed/search results
- GET /api/posts/{postId} — get single post detail
- PATCH /api/posts/{postId} — edit metadata
- DELETE /api/posts/{postId} — soft-delete post
- POST /api/posts/{postId}/vote — upvote/downvote/remove vote
- POST /api/posts/{postId}/report — moderation/reporting

Absolute minimum if you want to go live faster

- POST /api/posts
- GET /api/posts
- GET /api/posts/{postId}
- POST /api/posts/{postId}/vote
- POST /api/posts/{postId}/report

Optional/later

- GET /api/posts/me
- GET /api/users/{userId}/posts
- POST /api/posts/{postId}/download
- POST /api/posts/upload-url
- POST /api/posts/{postId}/restore
