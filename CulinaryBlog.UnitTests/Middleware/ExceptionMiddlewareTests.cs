using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using CulinaryBlog.Middleware;
using CulinaryBlog.Models;
using Xunit;

namespace CulinaryBlog.UnitTests.Middleware
{
    public class ExceptionMiddlewareTests
    {
        private readonly Mock<ILogger<ExceptionMiddleware>> _loggerMock;
        private readonly Mock<IHostEnvironment> _envMock;

        public ExceptionMiddlewareTests()
        {
            _loggerMock = new Mock<ILogger<ExceptionMiddleware>>();
            _envMock = new Mock<IHostEnvironment>();
        }

        [Fact]
        public async Task InvokeAsync_WhenNoException_ShouldCallNextDelegate()
        {
            // Arrange
            var context = new DefaultHttpContext();
            var wasNextCalled = false;

            RequestDelegate next = (ctx) =>
            {
                wasNextCalled = true;
                return Task.CompletedTask;
            };

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object, _envMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.True(wasNextCalled);
            Assert.Equal(200, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_WhenInvalidOperationException_ShouldReturn400BadRequest()
        {
            // Arrange
            var context = CreateHttpContextWithResponseBody();
            var expectedMessage = "Невалиден формат на файла.";

            RequestDelegate next = (ctx) => throw new InvalidOperationException(expectedMessage);

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object, _envMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            var errorResponse = await ReadResponseAsync(context);
            Assert.NotNull(errorResponse);
            Assert.Equal(400, errorResponse.StatusCode);
            Assert.Equal(expectedMessage, errorResponse.Message);
        }

        [Fact]
        public async Task InvokeAsync_WhenFileNotFoundException_ShouldReturn404NotFound()
        {
            // Arrange
            var context = CreateHttpContextWithResponseBody();

            RequestDelegate next = (ctx) => throw new FileNotFoundException("Снимката не е намерена.");

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object, _envMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);

            var errorResponse = await ReadResponseAsync(context);
            Assert.NotNull(errorResponse);
            Assert.Equal(404, errorResponse.StatusCode);
            Assert.Equal("Ресурсът или папката за съхранение не бяха намерени.", errorResponse.Message);
        }

        [Fact]
        public async Task InvokeAsync_WhenUnhandledExceptionInDevelopment_ShouldIncludeDetails()
        {
            // Arrange
            _envMock.Setup(e => e.EnvironmentName).Returns("Development");

            var context = CreateHttpContextWithResponseBody();
            RequestDelegate next = (ctx) => throw new System.Exception("DB Connection failed");

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object, _envMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);

            var errorResponse = await ReadResponseAsync(context);
            Assert.NotNull(errorResponse);
            Assert.Equal(500, errorResponse.StatusCode);
            Assert.Contains("System.Exception: DB Connection failed", errorResponse.Details);
        }

        [Fact]
        public async Task InvokeAsync_WhenUnhandledExceptionInProduction_ShouldNotIncludeDetails()
        {
            // Arrange
            _envMock.Setup(e => e.EnvironmentName).Returns("Production");

            var context = CreateHttpContextWithResponseBody();
            RequestDelegate next = (ctx) => throw new System.Exception("DB Connection failed");

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object, _envMock.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);

            var errorResponse = await ReadResponseAsync(context);
            Assert.NotNull(errorResponse);
            Assert.Equal(500, errorResponse.StatusCode);
            Assert.Null(errorResponse.Details);
        }

        // --- Помощни методи ---

        private static DefaultHttpContext CreateHttpContextWithResponseBody()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            return context;
        }

        private static async Task<ErrorDetails?> ReadResponseAsync(HttpContext context)
        {
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseText = await reader.ReadToEndAsync();

            return JsonSerializer.Deserialize<ErrorDetails>(responseText, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        }
    }
}