using Application.Auth;
using Application.Auth.Abstractions;
using Application.Users.GetCurrentUser;
using FluentValidation;

namespace Application.Users.UpdateCurrentUser;

public class UpdateCurrentUserHandler
{
    public static async Task<UpdateCurrentUserResult> Handle(
        UpdateCurrentUserCommand command,
        IValidator<UpdateCurrentUserCommand> validator,
        IAuthRepository authRepository,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(command, cancellationToken);
        if (!validationResult.IsValid)
        {
            return new UpdateCurrentUserResult(
                UpdateCurrentUserOutcome.InvalidRequest,
                string.Join(" ", validationResult.Errors.Select(error => error.ErrorMessage).Distinct()));
        }

        var user = await authRepository.GetUserForUpdateAsync(command.UserId, cancellationToken);
        if (user is null)
        {
            return new UpdateCurrentUserResult(
                UpdateCurrentUserOutcome.NotFound,
                "The requested user was not found.");
        }

        var normalizedUsername = command.Username is null
            ? null
            : AuthValueNormalizer.NormalizeUsername(command.Username);
        var normalizedFullName = command.FullName is null
            ? null
            : AuthValueNormalizer.NormalizeFullName(command.FullName);
        var normalizedPrivateEmail = command.PrivateEmail is null
            ? null
            : AuthValueNormalizer.NormalizeEmail(command.PrivateEmail);

        var hasUsernameChange = normalizedUsername is not null && user.Username != normalizedUsername;
        var hasFullNameChange = normalizedFullName is not null && user.FullName != normalizedFullName;
        var hasPrivateEmailChange = normalizedPrivateEmail is not null && user.PrivateEmail != normalizedPrivateEmail;

        if (hasUsernameChange && await authRepository.UsernameExistsAsync(normalizedUsername!, cancellationToken))
        {
            return new UpdateCurrentUserResult(
                UpdateCurrentUserOutcome.UsernameAlreadyRegistered,
                "That username is already taken.");
        }

        if (hasPrivateEmailChange && await authRepository.PrivateEmailExistsAsync(normalizedPrivateEmail!, cancellationToken))
        {
            return new UpdateCurrentUserResult(
                UpdateCurrentUserOutcome.PrivateEmailAlreadyRegistered,
                "A user with that private email already exists.");
        }

        if (hasUsernameChange)
        {
            user.Username = normalizedUsername!;
        }

        if (hasFullNameChange)
        {
            user.FullName = normalizedFullName!;
        }

        if (hasPrivateEmailChange)
        {
            user.PrivateEmail = normalizedPrivateEmail!;
        }

        if (hasUsernameChange || hasFullNameChange || hasPrivateEmailChange)
        {
            await authRepository.SaveChangesAsync(cancellationToken);
        }

        var currentUserResult = await authRepository.GetCurrentUserAsync(
            new GetCurrentUserQuery(user.Id),
            GetCurrentUserHandler.DefaultLatestPostsLimit,
            cancellationToken);

        if (currentUserResult.Outcome != GetCurrentUserOutcome.Success || currentUserResult.Item is null)
        {
            return new UpdateCurrentUserResult(
                UpdateCurrentUserOutcome.NotFound,
                "The requested user was not found.");
        }

        return new UpdateCurrentUserResult(
            UpdateCurrentUserOutcome.Success,
            hasUsernameChange || hasFullNameChange || hasPrivateEmailChange
                ? "Profile updated successfully."
                : "No profile changes were applied.",
            currentUserResult.Item);
    }
}
