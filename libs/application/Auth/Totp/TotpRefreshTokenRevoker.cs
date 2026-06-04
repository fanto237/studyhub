using Application.Auth.Abstractions;
using Domain.Entities;

namespace Application.Auth.Totp;

internal static class TotpRefreshTokenRevoker
{

  /// <summary>
  /// Revoke active refreshtoken from non totp-session
  /// </summary>
  /// <param name="user">Current active user</param>
  /// <param name="currentRefreshToken">Current Session's Refresh Token</param>
  /// <param name="authTokenService">Token Service</param>
  /// <param name="revokedAt">Revokation time</param>
  public static void RevokeOtherActiveRefreshTokens(
      User user,
      string? currentRefreshToken,
      IAuthTokenService authTokenService,
      DateTimeOffset revokedAt)
  {
    var currentRefreshTokenHash = string.IsNullOrWhiteSpace(currentRefreshToken)
        ? null
        : authTokenService.ComputeRefreshTokenHash(currentRefreshToken.Trim());

    foreach (var refreshToken in user.RefreshTokens.Where(refreshToken => refreshToken.RevokedAt is null))
    {
      if (currentRefreshTokenHash is not null && refreshToken.TokenHash == currentRefreshTokenHash)
      {
        continue;
      }

      refreshToken.RevokedAt = revokedAt;
      refreshToken.LastUsedAt = revokedAt;
    }
  }
}
