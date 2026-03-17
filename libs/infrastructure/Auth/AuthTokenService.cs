using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Auth.Abstractions;
using Application.Options;
using Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Auth;

public class AuthTokenService(IOptions<JwtSetting> jwtSettingOptions) : IAuthTokenService
{
    private readonly JwtSetting jwtSetting = jwtSettingOptions.Value;

    public IssuedAccessToken CreateAccessToken(User user, DateTimeOffset issuedAt)
    {
        var expiresAt = issuedAt.AddMinutes(jwtSetting.AccessTokenLifetimeMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSetting.Secret));
        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(JwtRegisteredClaimNames.Email, user.PrivateEmail),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: jwtSetting.Issuer,
            audience: jwtSetting.Audience,
            claims: claims,
            notBefore: issuedAt.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: signingCredentials);

        return new IssuedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public IssuedRefreshToken CreateRefreshToken(DateTimeOffset issuedAt)
    {
        var refreshToken = Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));
        var tokenHash = ComputeRefreshTokenHash(refreshToken);
        var expiresAt = issuedAt.AddDays(jwtSetting.RefreshTokenLifetimeDays);

        return new IssuedRefreshToken(refreshToken, tokenHash, expiresAt);
    }

    public string ComputeRefreshTokenHash(string refreshToken)
    {
        var normalizedRefreshToken = refreshToken.Trim();
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedRefreshToken));

        return Convert.ToHexString(hash);
    }
}
