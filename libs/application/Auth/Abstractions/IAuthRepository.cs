using Application.Users.GetCurrentUser;
using Application.Users.GetPublicUserProfile;
using Domain.Entities;

namespace Application.Auth.Abstractions;

public interface IAuthRepository
{
    Task<bool> PrivateEmailExistsAsync(string privateEmail, CancellationToken cancellationToken);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken);
    Task<bool> SchoolEmailExistsAsync(string schoolEmail, CancellationToken cancellationToken);
    Task<bool> IsUserActiveAsync(Guid userId, CancellationToken cancellationToken);
    Task<User?> GetUserByUsernameOrPrivateEmailAsync(string usernameOrPrivateEmail, CancellationToken cancellationToken);
    Task<GetCurrentUserResult> GetCurrentUserAsync(GetCurrentUserQuery query, int latestPostsLimit, CancellationToken cancellationToken);
    Task<GetPublicUserProfileResult> GetPublicUserProfileAsync(GetPublicUserProfileQuery query, int latestPostsLimit, CancellationToken cancellationToken);
    Task<User?> GetUserWithAuthCodesBySchoolEmailAsync(string schoolEmail, CancellationToken cancellationToken);
    Task<User?> GetUserForUpdateAsync(Guid userId, CancellationToken cancellationToken);
    Task<User?> GetUserForDeletionAsync(Guid userId, CancellationToken cancellationToken);
    Task<UserRefreshToken?> GetRefreshTokenWithUserByHashAsync(string tokenHash, CancellationToken cancellationToken);
    void AddUser(User user);
    void AddAuthCode(UserAuthCode authCode);
    void AddRefreshToken(UserRefreshToken refreshToken);
    void RemoveAuthCodes(IEnumerable<UserAuthCode> authCodes);
    void RemoveRefreshTokens(IEnumerable<UserRefreshToken> refreshTokens);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
