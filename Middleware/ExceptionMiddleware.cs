using System.Net;
using CulinaryBlog.Models;

namespace CulinaryBlog.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            // Улавяме отмяна на заявката от клиента (прекъснат upload, затворен браузър) отделно
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Заявката беше прекратена от клиента (CancellationToken активиран).");

                if (httpContext.Response.HasStarted)
                {
                    return;
                }

                httpContext.Response.ContentType = "application/json";
                httpContext.Response.StatusCode = 499; // Client Closed Request

                var response = new ErrorDetails
                {
                    Timestamp = DateTime.UtcNow,
                    StatusCode = 499,
                    Message = "Заявката беше отменена от клиента."
                };

                await httpContext.Response.WriteAsync(response.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Възникна необработена грешка: {Message}", ex.Message);
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ErrorDetails
            {
                Timestamp = DateTime.UtcNow
            };

            switch (exception)
            {
                case InvalidOperationException invalidOpEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = invalidOpEx.Message;
                    break;

                case BadHttpRequestException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Невалидна заявка или надвишен разрешен размер на качвания файл.";
                    break;

                case DirectoryNotFoundException or FileNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Ресурсът или папката за съхранение не бяха намерени.";
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Нямате права за достъп или запис в тази директория.";
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Възникна неочаквана сървърна грешка при обработка на заявката.";

                    if (_env.IsDevelopment())
                    {
                        response.Details = exception.ToString();
                    }
                    break;
            }

            return context.Response.WriteAsync(response.ToString());
        }
    }
}