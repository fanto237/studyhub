using Application.Auth.Abstractions;
using Domain.Entities;
using FluentValidation;

namespace Application.Users.DeleteUser;

public class DeleteUserHandler
{
    public static async Task<DeleteUserResult> Handle(
        DeleteUserCommand command,
        IValidator<DeleteUserCommand> validator,
        IAuthRepository authRepository,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new DeleteUserResult(
                DeleteUserOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var now = timeProvider.GetUtcNow();
        DeleteUserResult? result = null;

        await authRepository.ExecuteInTransactionAsync(async ct =>
        {
            var user = await authRepository.GetUserForDeletionAsync(command.UserId, ct);
            if (user is null)
            {
                result = new DeleteUserResult(
                    DeleteUserOutcome.NotFound,
                    "The requested user was not found.");
                return;
            }

            if (user.DeletedAt is not null)
            {
                result = new DeleteUserResult(
                    DeleteUserOutcome.AlreadyDeleted,
                    "The requested user account has already been deleted.");
                return;
            }

            authRepository.RemoveAuthCodes(user.AuthCodes.ToArray());
            authRepository.RemoveRefreshTokens(user.RefreshTokens.ToArray());

            user.IsTotpEnabled = false;
            user.TotpSecret = null;
            user.TotpEnabledAt = null;
            user.TotpLastUsedTimeStep = null;
            user.TotpPendingSecret = null;
            user.TotpPendingSecretCreatedAt = null;

            user.PrivateEmail = $"deleted+{user.Id:D}@deleted.studyhub.local";
            user.SchoolEmail = $"deleted-school+{user.Id:D}@deleted.studyhub.local";
            user.Username = $"{User.DeletedUsername}-{user.Id:N}";
            user.FullName = User.DeletedFullName;
            user.UniversityName = User.DeletedFullName;
            user.PasswordHash = "DELETED_ACCOUNT";
            user.IsVerified = false;
            user.LastVerifiedAt = null;
            user.DeletedAt = now;

            await authRepository.SaveChangesAsync(ct);

            result = new DeleteUserResult(
                DeleteUserOutcome.Success,
                "User account deleted successfully.");
        }, cancellationToken);

        return result!;
    }
}
