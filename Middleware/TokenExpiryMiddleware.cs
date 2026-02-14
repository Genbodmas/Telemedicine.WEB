using System.IdentityModel.Tokens.Jwt;

namespace Telemedicine.Web.Middleware
{
    public class TokenExpiryMiddleware
    {
        private readonly RequestDelegate _next;
        private static readonly HashSet<string> PublicPaths = new(StringComparer.OrdinalIgnoreCase)
        {
            "/", "/auth/login", "/auth/register", "/auth/logout", "/home", "/home/index"
        };

        public TokenExpiryMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.TrimEnd('/') ?? "";

            // Allow public paths, static files, and error pages
            if (IsPublicPath(path))
            {
                await _next(context);
                return;
            }

            var token = context.Request.Cookies["jwtToken"];

            if (string.IsNullOrEmpty(token) || IsTokenExpired(token))
            {
                // Clear stale cookies
                context.Response.Cookies.Delete("jwtToken");
                context.Response.Cookies.Delete("userName");
                context.Response.Cookies.Delete("userId");
                context.Response.Cookies.Delete("userRole");

                context.Response.Redirect("/Auth/Login");
                return;
            }

            await _next(context);
        }

        private static bool IsPublicPath(string path)
        {
            if (string.IsNullOrEmpty(path)) return true;
            return PublicPaths.Contains(path) 
                || path.StartsWith("/css", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/js", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/lib", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/images", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/_", StringComparison.OrdinalIgnoreCase)
                || path.Contains('.'); // static files
        }

        private static bool IsTokenExpired(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                return jwt.ValidTo < DateTime.UtcNow;
            }
            catch
            {
                return true; // If we can't read it, treat as expired
            }
        }
    }
}
