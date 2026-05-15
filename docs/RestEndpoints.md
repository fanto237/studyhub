Missing endpoints

### Comments

These are in docs/RestEndpoints.md but not fully built:

- GET /api/posts/{postId}/comments
  - Not implemented as a standalone endpoint.
  - Current workaround: GET /api/posts/{postId} returns comments inside post detail.
- PATCH /api/comments/{commentId}
  - Not implemented.
  - There is no update-comment handler/DTO yet.

────────────────────────────────────────────────────────────────────────────────

### Optional/later post endpoints

Listed in docs/Posts-Endpoints.md as optional/later, not built yet:

- POST /api/posts/upload-url
- POST /api/posts/{postId}/restore
