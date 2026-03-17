using Domain.Entities;

namespace Application.Auth.Abstractions;

public interface IAuthRepository
{
    Task<bool> PrivateEmailExistsAsync(string privateEmail, CancellationToken cancellationToken);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken);
    Task<bool> SchoolEmailExistsAsync(string schoolEmail, CancellationToken cancellationToken);
    void AddUser(User user);
    void AddAuthCode(UserAuthCode authCode);
    Task<User?> GetUserWithAuthCodesBySchoolEmailAsync(string schoolEmail, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
