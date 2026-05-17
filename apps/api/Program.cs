using Api.Endpoints;
using Api.Extensions;
using Api.Responses;
using Application;
using Application.Extensions;
using Application.Posts.CreatePost;
using Domain.Entities;
using Infrastructure.Extensions;
using Microsoft.AspNetCore.Identity;
using Wolverine;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseWolverine(options =>
{
  options.Discovery.IncludeAssembly(typeof(CreatePostHandler).Assembly);
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

app.UseExceptionHandler(exceptionApp =>
{
  exceptionApp.Run(async context =>
  {
    await Results.Json(
        SendResponse.Error("An unexpected error occurred."),
        statusCode: StatusCodes.Status500InternalServerError)
      .ExecuteAsync(context);
  });
});

if (!app.Environment.IsDevelopment())
{
  app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapAuthEndpoints();
app.MapCommentEndpoints();
app.MapFeedEndpoints();
app.MapPostEndpoints();
app.MapUserEndpoints();
app.Run();
