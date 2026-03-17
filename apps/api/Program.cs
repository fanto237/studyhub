using Api.Extensions;
using Application;
using Application.Extensions;
using Domain.Entities;
using Infrastructure.Extensions;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Wolverine;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    var applicationSettingsPath = Path.GetFullPath(
        Path.Combine(builder.Environment.ContentRootPath, "../../libs/application/appsettings.Development.json"));
    var infrastructureSettingsPath = Path.GetFullPath(
        Path.Combine(builder.Environment.ContentRootPath, "../../libs/infrastructure/appsettings.Development.json"));

    builder.Configuration.AddJsonFile(applicationSettingsPath, optional: true, reloadOnChange: true);
    builder.Configuration.AddJsonFile(infrastructureSettingsPath, optional: true, reloadOnChange: true);
    builder.Configuration.AddUserSecrets<ApplicationAssemblyMarker>(optional: true);
    builder.Configuration.AddUserSecrets<StudyHubDbContext>(optional: true);
}

builder.Host.UseWolverine(options =>
{
    options.Discovery.IncludeAssembly(typeof(ApplicationAssemblyMarker).Assembly);
});

builder.Services.AddOpenApi();
builder.Services.AddApplication();
builder.Services.AddApiAuthentication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapAuthEndpoints();
app.Run();
