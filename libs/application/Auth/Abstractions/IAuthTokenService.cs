using Domain.Entities;

namespace Application.Auth.Abstractions;

public interface IAuthTokenService
{
    IssuedAccessToken CreateAccessToken(User user, DateTimeOffset issuedAt);
    IssuedRefreshToken CreateRefreshToken(DateTimeOffset issuedAt);
    string ComputeRefreshTokenHash(string refreshToken);
}
