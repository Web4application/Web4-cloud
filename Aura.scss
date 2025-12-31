using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace csharp_login_example
{
    class LoginContent
    {
        public string ClientId { get; init; }
        public string AuthToken { get; init; }
        public string Login { get; init; }
        public string? Password { get; init; } = null;
        public string? PasswordHash { get; init; } = null;
        public bool? PassEncrypted { get; init; } = null;
    }

    class LoginResponse
    {
        public string Token { get; init; } = "";
    }

    class Program
    {
        static async Task Main(string[] args)
        {
            using var client = new HttpClient()
            {
                BaseAddress = new Uri("http://localhost:8001/")
            };

            client.DefaultRequestHeaders
              .Accept
              .Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var token = await Login(client);

            Console.WriteLine(token);
        }

        private static async Task<string> Login(HttpClient client)
        {
            var loginData = new LoginContent()
            {
                ClientId = "aura",
                AuthToken = "441be0dc4da0da9c3f196da62d72419883b75eb2023c0e5a6f202564a2f82234",
                Login = "super",
                PasswordHash = "86f7e437faa5a7fce15d1ddcb9eaeaea377667b8",
                PassEncrypted = true,
            };

            var serializeOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                WriteIndented = true
            };
            var json = JsonSerializer.Serialize(loginData, serializeOptions);

            var request = new HttpRequestMessage(HttpMethod.Post, "/_/security/login");
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var data = await response.Content.ReadFromJsonAsync<LoginResponse>();

            return data.Token;
        }
    }
}
Use a token to get products:
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Dynamic;

namespace csharp_example
{
    class Program
    {

        static async Task Main(string[] args)
        {
            using var client = new HttpClient()
            {
                BaseAddress = new Uri("http://localhost:8001/")
            };

            client.DefaultRequestHeaders
              .Accept
              .Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NT" +
                "cyODA3NjAsImp0aSI6IjYyYzgxOGY4YWY3ZWMiLCJpc3MiOiJhdXJhIiwiY" +
                "XVkIjp7ImlkIjoyMSwibG9naW4iOiJIYW5kbG93aWVjIiwicHJvZmlsZSI6" +
                "NywidHlwZSI6Miwicm9sZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiJ" +
                "dLCJwY2EiOiIyMDE4LTAxLTI5IDE1OjIzOjQ2In19.81bc0ed72cf0f71c5" +
                "6a7f8de46feba1293afa03bd4ebaf855eb4bfd09719538f";

            client.DefaultRequestHeaders
                .Authorization = new AuthenticationHeaderValue("Bearer", token);

            Console.WriteLine(await GetProducts(client));
        }

        private static async Task<string> GetProducts(HttpClient client)
        {
            using var response = await client.GetAsync("/api/products");
            response.EnsureSuccessStatusCode();

            dynamic data = await response.Content.ReadFromJsonAsync<ExpandoObject>();

            var serializeOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
            var json = JsonSerializer.Serialize(data.data, serializeOptions);

            return json;
