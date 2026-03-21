using Application.Auth.Abstractions;
using Application.Users.GetCurrentUser;
using Application.Users.GetPublicUserProfile;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Auth;

public class AuthRepository(StudyHubDbContext dbContext) : IAuthRepository
{
  public Task<bool> PrivateEmailExistsAsync(string privateEmail, CancellationToken cancellationToken)
  {
    return dbContext.Users.AnyAsync(user => user.PrivateEmail == privateEmail, cancellationToken);
  }

  public Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken)
  {
    return dbContext.Users.AnyAsync(user => user.Username == username, cancellationToken);
  }

  public Task<bool> SchoolEmailExistsAsync(string schoolEmail, CancellationToken cancellationToken)
  {
    return dbContext.Users.AnyAsync(user => user.SchoolEmail == schoolEmail, cancellationToken);
  }

  public Task<User?> GetUserByUsernameOrPrivateEmailAsync(string usernameOrPrivateEmail, CancellationToken cancellationToken)
  {
    return dbContext.Users.SingleOrDefaultAsync(
        user => user.Username == usernameOrPrivateEmail || user.PrivateEmail == usernameOrPrivateEmail,
        cancellationToken);
  }

  public async Task<GetCurrentUserResult> GetCurrentUserAsync(
      GetCurrentUserQuery query,
      int latestPostsLimit,
      CancellationToken cancellationToken)
  {
    var user = await dbContext.Users
        .AsNoTracking()
        .Where(candidate => candidate.Id == query.UserId)
        .Select(candidate => new CurrentUserProfile(
            candidate.Id,
            candidate.Username,
            candidate.FullName,
            candidate.PrivateEmail,
            candidate.SchoolEmail,
            candidate.UniversityName,
            candidate.Role,
            candidate.IsVerified,
            candidate.LastVerifiedAt,
            candidate.KarmaScore,
            candidate.CreatedAt,
            candidate.Posts
                .Where(post => post.DeletedAt == null && !post.IsHidden)
                .OrderByDescending(post => post.CreatedAt)
                .Take(latestPostsLimit)
                .Select(post => new CurrentUserLatestPost(
                    post.Id,
                    post.Title,
                    post.Description,
                    post.StorageUrl,
                    post.Upvotes,
                    post.Downvotes,
                    post.Upvotes - post.Downvotes,
                    post.CreatedAt,
                    post.Comments.Count,
                    post.PostTags
                        .OrderBy(postTag => postTag.Tag.Name)
                        .Select(postTag => postTag.Tag.Name)
                        .ToArray()))
                .ToArray()))
        .FirstOrDefaultAsync(cancellationToken);

    if (user is null)
    {
      return new GetCurrentUserResult(
          GetCurrentUserOutcome.NotFound,
          "The requested user was not found.");
    }

    return new GetCurrentUserResult(
        GetCurrentUserOutcome.Success,
        "Current user retrieved successfully.",
        user);
  }

  public async Task<GetPublicUserProfileResult> GetPublicUserProfileAsync(
      GetPublicUserProfileQuery query,
      int latestPostsLimit,
      CancellationToken cancellationToken)
  {
    var user = await dbContext.Users
        .AsNoTracking()
        .Where(candidate => candidate.Id == query.UserId)
        .Select(candidate => new PublicUserProfile(
            candidate.Id,
            candidate.Username,
            candidate.UniversityName,
            candidate.IsVerified,
            candidate.KarmaScore,
            candidate.CreatedAt,
            candidate.Posts.Count(post => post.DeletedAt == null && !post.IsHidden),
            candidate.Posts
                .Where(post => post.DeletedAt == null && !post.IsHidden)
                .Sum(post => post.Upvotes),
            candidate.Posts
                .Where(post => post.DeletedAt == null && !post.IsHidden)
                .OrderByDescending(post => post.CreatedAt)
                .Take(latestPostsLimit)
                .Select(post => new PublicUserLatestPost(
                    post.Id,
                    post.Title,
                    post.Description,
                    post.StorageUrl,
                    post.Upvotes,
                    post.Downvotes,
                    post.Upvotes - post.Downvotes,
                    post.CreatedAt,
                    post.Comments.Count,
                    post.PostTags
                        .OrderBy(postTag => postTag.Tag.Name)
                        .Select(postTag => postTag.Tag.Name)
                        .ToArray()))
                .ToArray()))
        .FirstOrDefaultAsync(cancellationToken);

    if (user is null)
    {
      return new GetPublicUserProfileResult(
          GetPublicUserProfileOutcome.NotFound,
          "The requested user was not found.");
    }

    return new GetPublicUserProfileResult(
        GetPublicUserProfileOutcome.Success,
        "Public user profile retrieved successfully.",
        user);
  }

  public void AddUser(User user)
  {
    dbContext.Users.Add(user);
  }

  public void AddAuthCode(UserAuthCode authCode)
  {
    dbContext.UserAuthCodes.Add(authCode);
  }

  public void AddRefreshToken(UserRefreshToken refreshToken)
  {
    dbContext.UserRefreshTokens.Add(refreshToken);
  }

  public Task<User?> GetUserWithAuthCodesBySchoolEmailAsync(string schoolEmail, CancellationToken cancellationToken)
  {
    return dbContext.Users
        .Include(user => user.AuthCodes)
        .SingleOrDefaultAsync(user => user.SchoolEmail == schoolEmail, cancellationToken);
  }

  public Task<UserRefreshToken?> GetRefreshTokenWithUserByHashAsync(string tokenHash, CancellationToken cancellationToken)
  {
    return dbContext.UserRefreshTokens
        .Include(refreshToken => refreshToken.User)
        .SingleOrDefaultAsync(refreshToken => refreshToken.TokenHash == tokenHash, cancellationToken);
  }

  public Task SaveChangesAsync(CancellationToken cancellationToken)
  {
    return dbContext.SaveChangesAsync(cancellationToken);
  }

  public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken)
  {
    await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

    try
    {
      await operation(cancellationToken);
      await transaction.CommitAsync(cancellationToken);
    }
    catch
    {
      await transaction.RollbackAsync(cancellationToken);
      throw;
    }
  }
}
