using Application.Auth.Abstractions;
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

    public void AddUser(User user)
    {
        dbContext.Users.Add(user);
    }

    public void AddAuthCode(UserAuthCode authCode)
    {
        dbContext.UserAuthCodes.Add(authCode);
    }

    public Task<User?> GetUserWithAuthCodesBySchoolEmailAsync(string schoolEmail, CancellationToken cancellationToken)
    {
        return dbContext.Users
            .Include(user => user.AuthCodes)
            .SingleOrDefaultAsync(user => user.SchoolEmail == schoolEmail, cancellationToken);
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
