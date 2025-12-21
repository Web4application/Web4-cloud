--- 
title: Respond with another site · Cloudflare Workers docs
description: Respond to the Worker request with the response from another
website: (example.com in this example).
lastUpdated: 2025-10-17T07:10:47.000Z
chatbotDeprioritize: false
tags: Middleware,JavaScript,TypeScript,Python
source_url: 
  html: https://developers.cloudflare.com/workers/examples/respond-with-another-site/
  md: https://developers.cloudflare.com/workers/examples/respond-with-another-site/index.md
---

If you want to get started quickly, click on the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/docs-examples/tree/main/workers/respond-with-another-site)

This creates a repository in your GitHub account and deploys the application to Cloudflare Workers.

* JavaScript

  ```js
  export default {
    async fetch(request) {
      function MethodNotAllowed(request) {
        return new Response(`Method ${request.method} not allowed.`, {
          status: 405,
          headers: {
            Allow: "GET",
          },
        });
      }
      // Only GET requests work with this proxy.
      if (request.method !== "GET") return MethodNotAllowed(request);
      return fetch(`https://example.com`);
    },
  };

  ```

  [Run Worker in Playground](https://workers.cloudflare.com/playground#LYVwNgLglgDghgJwgegGYHsHALQBM4RwDcABAEbogB2+CAngLzbPYZb6HbW5QDGU2AAyCAzAFYA7ADYALDMESATAEYAXCxZtgHOFxp8Bw8dLkKVAWABQAYXRUIAU3vYAIlADOMdO6jQ7qki08AmISKjhgBwYAIigaBwAPADoAK3do0lQoMCcIqNj45LToq1t7JwhsABU6GAcAuBgYMD4CKDtkFLgANzh3XgRYCABqYHRccAcrK0SvJBJcB1Q4cAgSAG9LEhI+uipeQIcIXgALAAoEBwBHEAd3CABKDa3twOpePyoSAFkjk-GAHLoCAAQTAYHQAHcHLgLtdbvcnptXq9LhAQAgvlQHJCSAAlO5eKjuBxnAAGvwg-1wJAAJOtLjc7hAkpEqeMAL5hYE7cFQmFJMkAGmeKJR9wIIHcAXkYiFLzFJBODjgiwQ0tFiteYIhkIC0QA4gBRKrReVakgc81ijkPIgKy0O5DIEgAeSoYDoJGNVRIjIREHcJEhmAA1sHfCcSFSPCQYAh0Ak6EkHVBUCQ4Uz7qy-uMSABCBgMEiGk3RJ5ojFfSnUoGgvnQ2H+5l2h2VzGHY7nMknCAQGDS52JCLNBxJXjoYBk1vbK2WDlEKwaZhaHR6Hj8ISiSSyeRKZSlOyOZxuTzeXztKgBII6UjhSIxNmqkIZQLZXIP6JkCFkEo2I8VNUtT1DsTQtLwbQdGkdjTJY6zRMAcBxAA+mMEw5NEqgFIsRTpByS7LquITrgYW7GLuZjKMwVhAA)

* TypeScript

  ```ts
  export default {
    async fetch(request): Promise<Response> {
      function MethodNotAllowed(request) {
        return new Response(`Method ${request.method} not allowed.`, {
          status: 405,
          headers: {
            Allow: "GET",
          },
        });
      }
      // Only GET requests work with this proxy.
      if (request.method !== "GET") return MethodNotAllowed(request);
      return fetch(`https://example.com`);
    },
  } satisfies ExportedHandler;
  ```

* Python

  ```py
  from workers import WorkerEntrypoint, Response, fetch


  class Default(WorkerEntrypoint):
      def fetch(self, request):
          def method_not_allowed(request):
              msg = f'Method {request.method} not allowed.'
              headers = {"Allow": "GET"}
              return Response(msg, headers=headers, status=405)


          # Only GET requests work with this proxy.
          if request.method != "GET":
              return method_not_allowed(request)


          return fetch("https://example.com")
  ```
---
