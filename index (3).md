---
title: Limits · Cloudflare Workers docs
description: Cloudflare Workers plan and platform limits.
lastUpdated: 2025-11-05T22:40:03.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/workers/platform/limits/
  md: https://developers.cloudflare.com/workers/platform/limits/index.md
---

## Account plan limits

| Feature | Workers Free | Workers Paid |
| - | - | - |
| [Subrequests](#subrequests) | 50/request | 1000/request |
| [Simultaneous outgoing connections/request](#simultaneous-open-connections) | 6 | 6 |
| [Environment variables](#environment-variables) | 64/Worker | 128/Worker |
| [Environment variable size](#environment-variables) | 5 KB | 5 KB |
| [Worker size](#worker-size) | 3 MB | 10 MB |
| [Worker startup time](#worker-startup-time) | 1 second | 1 second |
| [Number of Workers](#number-of-workers)1 | 100 | 500 |
| Number of [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) per account | 5 | 250 |
| Number of [Static Asset](#static-assets) files per Worker version | 20,000 | 100,000 |
| Individual [Static Asset](#static-assets) file size | 25 MiB | 25 MiB |

1 If you are running into limits, your project may be a good fit for [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/).

Need a higher limit?

To request an adjustment to a limit, complete the [Limit Increase Request Form](https://forms.gle/ukpeZVLWLnKeixDu7). If the limit can be increased, Cloudflare will contact you with next steps.

***

## Request limits

URLs have a limit of 16 KB.

Request headers observe a total limit of 128 KB.

Cloudflare has network-wide limits on the request body size. This limit is tied to your Cloudflare account's plan, which is separate from your Workers plan. When the request body size of your `POST`/`PUT`/`PATCH` requests exceed your plan's limit, the request is rejected with a `(413) Request entity too large` error.

Cloudflare Enterprise customers may contact their account team or [Cloudflare Support](https://developers.cloudflare.com/support/contacting-cloudflare-support/) to have a request body limit beyond 500 MB.

| Cloudflare Plan | Maximum body size |
| - | - |
| Free | 100 MB |
| Pro | 100 MB |
| Business | 200 MB |
| Enterprise | 500 MB (by default) |

***

## Response limits

Response headers observe a total limit of 128 KB.

Cloudflare does not enforce response limits on response body sizes, but cache limits for [our CDN are observed](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/). Maximum file size is 512 MB for Free, Pro, and Business customers and 5 GB for Enterprise customers.

***

## Worker limits

| Feature | Workers Free | Workers Paid |
| - | - | - |
| [Request](#request) | 100,000 requests/day 1000 requests/min | No limit |
| [Worker memory](#memory) | 128 MB | 128 MB |
| [CPU time](#cpu-time) | 10 ms | 5 min HTTP request 15 min [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/) |
| [Duration](#duration) | No limit | No limit for Workers. 15 min duration limit for [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Durable Object Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/) and [Queue Consumers](https://developers.cloudflare.com/queues/configuration/javascript-apis/#consumer) |

### Duration

Duration is a measurement of wall-clock time — the total amount of time from the start to end of an invocation of a Worker. There is no hard limit on the duration of a Worker. As long as the client that sent the request remains connected, the Worker can continue processing, making subrequests, and setting timeouts on behalf of that request. When the client disconnects, all tasks associated with that client request are canceled. Use [`event.waitUntil()`](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/) to delay cancellation for another 30 seconds or until the promise passed to `waitUntil()` completes.

Note

Cloudflare updates the Workers runtime a few times per week. When this happens, any in-flight requests are given a grace period of 30 seconds to finish. If a request does not finish within this time, it is terminated. While your application should follow the best practice of handling disconnects by retrying requests, this scenario is extremely improbable. To encounter it, you would need to have a request that takes longer than 30 seconds that also happens to intersect with the exact time an update to the runtime is happening.

### CPU time

CPU time is the amount of time the CPU actually spends doing work during a given request. If a Worker's request makes a sub-request and waits for that request to come back before doing additional work, this time spent waiting **is not** counted towards CPU time.

**Most Workers requests consume less than 1-2 milliseconds of CPU time**, but you can increase the maximum CPU time from the default 30 seconds to 5 minutes (300,000 milliseconds) if you have CPU-bound tasks, such as large JSON payloads that need to be serialized, cryptographic key generation, or other data processing tasks.

Each [isolate](https://developers.cloudflare.com/workers/reference/how-workers-works/#isolates) has some built-in flexibility to allow for cases where your Worker infrequently runs over the configured limit. If your Worker starts hitting the limit consistently, its execution will be terminated according to the limit configured.

To understand your CPU usage:

* CPU time and Wall time are surfaced in the [invocation log](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#invocation-logs) within Workers Logs.
* For Tail Workers, CPU time and Wall time are surfaced at the top level of the [Workers Trace Events object](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/).
* DevTools locally can help identify CPU intensive portions of your code. See the [CPU profiling with DevTools documentation](https://developers.cloudflare.com/workers/observability/dev-tools/cpu-usage/).

You can also set a [custom limit](https://developers.cloudflare.com/workers/wrangler/configuration/#limits) on the amount of CPU time that can be used during each invocation of your Worker.

* wrangler.jsonc

  ```jsonc
  {
    // ...rest of your configuration...
    "limits": {
      "cpu_ms": 300000, // default is 30000 (30 seconds)
    },
    // ...rest of your configuration...
  }
  ```

* wrangler.toml

  ```toml
  [limits]
  cpu_ms = 300_000
  ```

You can also customize this in the [Workers dashboard](https://dash.cloudflare.com/?to=/:account/workers). Select the specific Worker you wish to modify -> click on the "Settings" tab -> adjust the CPU time limit.

Note

Scheduled Workers ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)) have different limits on CPU time based on the schedule interval. When the schedule interval is less than 1 hour, a Scheduled Worker may run for up to 30 seconds. When the schedule interval is 1 hour or more, a scheduled Worker may run for up to 15 minutes.

***

## Cache API limits

| Feature | Workers Free | Workers Paid |
| - | - | - |
| [Maximum object size](#cache-api-limits) | 512 MB | 512 MB |
| [Calls/request](#cache-api-limits) | 50 | 1,000 |

Calls/request means the number of calls to `put()`, `match()`, or `delete()` Cache API method per-request, using the same quota as subrequests (`fetch()`).

Note

The size of chunked response bodies (`Transfer-Encoding: chunked`) is not known in advance. Then, `.put()`ing such responses will block subsequent `.put()`s from starting until the current `.put()` completes.

***

## Request

Workers automatically scale onto thousands of Cloudflare global network servers around the world. There is no general limit to the number of requests per second Workers can handle.

### Daily request

Accounts using the Workers Free plan are subject to a daily request limit of 100,000 requests. Free plan daily requests counts reset at midnight UTC. A Worker that fails as a result of daily request limit errors can be configured by toggling its corresponding [route](https://developers.cloudflare.com/workers/configuration/routing/routes/) in two modes: 1) Fail open and 2) Fail closed.

#### Fail open

Routes in fail open mode will bypass the failing Worker and prevent it from operating on incoming traffic. Incoming requests will behave as if there was no Worker.

#### Fail closed

Routes in fail closed mode will display a Cloudflare `1027` error page to visitors, signifying the Worker has been temporarily disabled. Cloudflare recommends this option if your Worker is performing security related tasks.

***

## Memory

Each [isolate](https://developers.cloudflare.com/workers/reference/how-workers-works/#isolates) of your Worker's code runs in can consume up to 128 MB of memory. This includes both memory used by the JavaScript heap, and memory explicitly allocated in [WebAssembly](https://developers.cloudflare.com/workers/runtime-apis/webassembly/). Note that this limit is per-isolate, not per-invocation of your Worker. A single isolate can handle many concurrent requests.

When an isolate running your Worker exceeds 128 MB of memory, the Workers runtime handles this gracefully instead of failing immediately. It allows in-flight requests to complete while simultaneously creating a new isolate for your Worker for new requests. While this approach typically allows in-flight requests to complete, during periods of extremely high load, some incoming requests may be cancelled to maintain system stability.

To view out-of-memory errors (OOM), as well as CPU limit overages:

1. In the Cloudflare dashboard, go to the **Workers & Pages** page.

   [Go to **Workers & Pages**](https://dash.cloudflare.com/?to=/:account/workers-and-pages)

2. Select the Worker you would like to investigate.

3. Under **Metrics**, select **Errors** > **Invocation Statuses** and examine **Exceeded Memory**.

To avoid exceeding memory limits, where possible you should avoid buffering large objects or responses in memory, and instead use streaming APIs such as [`TransformStream`](https://developers.cloudflare.com/workers/runtime-apis/streams/transformstream/) or [`node:stream`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/streams/) to stream responses. Manipulating streams allows you to avoid buffering entire responses in memory.

You can also use Chrome DevTools in local development to identify memory leaks in your code. See the [memory profiling with DevTools documentation](https://developers.cloudflare.com/workers/observability/dev-tools/memory-usage/) to learn more.

***

## Subrequests

A subrequest is any request that a Worker makes to either Internet resources using the [Fetch API](https://developers.cloudflare.com/workers/runtime-apis/fetch/) or requests to other Cloudflare services like [R2](https://developers.cloudflare.com/r2/), [KV](https://developers.cloudflare.com/kv/), or [D1](https://developers.cloudflare.com/d1/).

### Worker-to-Worker subrequests

To make subrequests from your Worker to another Worker on your account, use [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/). Service bindings allow you to send HTTP requests to another Worker without those requests going over the Internet.

If you attempt to use global [`fetch()`](https://developers.cloudflare.com/workers/runtime-apis/fetch/) to make a subrequest to another Worker on your account that runs on the same [zone](https://developers.cloudflare.com/fundamentals/concepts/accounts-and-zones/#zones), without service bindings, the request will fail.

If you make a subrequest from your Worker to a target Worker that runs on a [Custom Domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#worker-to-worker-communication) rather than a route, the request will be allowed.

### How many subrequests can I make?

You can make 50 subrequests per request on Workers Free, and 1,000 subrequests per request on Workers Paid. Each subrequest in a redirect chain counts against this limit. This means that the number of subrequests a Worker makes could be greater than the number of `fetch(request)` calls in the Worker.

For subrequests to internal services like Workers KV and Durable Objects, the subrequest limit is 1,000 per request, regardless of the [usage model](https://developers.cloudflare.com/workers/platform/pricing/#workers) configured for the Worker.

### How long can a subrequest take?

There is no set limit on the amount of real time a Worker may use. As long as the client which sent a request remains connected, the Worker may continue processing, making subrequests, and setting timeouts on behalf of that request.

When the client disconnects, all tasks associated with that client’s request are proactively canceled. If the Worker passed a promise to [`event.waitUntil()`](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/), cancellation will be delayed until the promise has completed or until an additional 30 seconds have elapsed, whichever happens first.

***

## Simultaneous open connections

You can open up to six connections simultaneously for each invocation of your Worker. The connections opened by the following API calls all count toward this limit:

* the `fetch()` method of the [Fetch API](https://developers.cloudflare.com/workers/runtime-apis/fetch/).
* `get()`, `put()`, `list()`, and `delete()` methods of [Workers KV namespace objects](https://developers.cloudflare.com/kv/api/).
* `put()`, `match()`, and `delete()` methods of [Cache objects](https://developers.cloudflare.com/workers/runtime-apis/cache/).
* `list()`, `get()`, `put()`, `delete()`, and `head()` methods of [R2](https://developers.cloudflare.com/r2/).
* `send()` and `sendBatch()`, methods of [Queues](https://developers.cloudflare.com/queues/).
* Opening a TCP socket using the [`connect()`](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) API.

Outbound WebSocket connections are just HTTP connections and thus also contribute to the maximum concurrent connections limit.

Once an invocation has six connections open, it can still attempt to open additional connections.

* These attempts are put in a pending queue — the connections will not be initiated until one of the currently open connections has closed.
* Earlier connections can delay later ones, if a Worker tries to make many simultaneous subrequests, its later subrequests may appear to take longer to start.
* Earlier connections that are stalled1 might get closed with a `Response closed due to connection limit` exception.

If you have cases in your application that use `fetch()` but that do not require consuming the response body, you can avoid the unread response body from consuming a concurrent connection by using `response.body.cancel()`.

For example, if you want to check whether the HTTP response code is successful (2xx) before consuming the body, you should explicitly cancel the pending response body:

```ts
const response = await fetch(url);


// Only read the response body for successful responses
if (response.statusCode <= 299) {
  // Call response.json(), response.text() or otherwise process the body
} else {
  // Explicitly cancel it
  response.body.cancel();
}
```

This will free up an open connection.

If the system detects that a Worker is deadlocked on stalled connections1 — for example, if the Worker has pending connection attempts but has no in-progress reads or writes on the connections that it already has open — then the least-recently-used open connection will be canceled to unblock the Worker.

If the Worker later attempts to use a canceled connection, a `Response closed due to connection limit` exception will be thrown. These exceptions should rarely occur in practice, though, since it is uncommon for a Worker to open a connection that it does not have an immediate use for.

1A connections is considered stalled when it is not not being actively read from or written to, for example:

```ts
// Within a for-of loop
const response = await fetch("https://example.org");
for await (const chunk of response.body) {
  // While this code block is executing, there are no pending
  // reads on the response.body. Accordingly, the system may view
  // the stream as not being active within this block.
}


// Using body.getReader()
const response = await fetch("https://example.org");
const reader = response.body.getReader();
let chunk = await reader.read();
await processChunk(chunk);
chunk = await reader.read();
await processChunk(chunk);


async function processChunk(chunk) {
  // The stream is considered inactive as there is no pending reads
  // on response.body. It may then get cancelled.
}
```

Note

Simultaneous Open Connections are measured from the top-level request, meaning any connections open from Workers sharing resources (for example, Workers triggered via [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)) will share the simultaneous open connection limit.

***

## Environment variables

The maximum number of environment variables (secret and text combined) for a Worker is 128 variables on the Workers Paid plan, and 64 variables on the Workers Free plan. There is no limit to the number of environment variables per account.

Each environment variable has a size limitation of 5 KB.

***

## Worker size

A Worker can be up to 10 MB in size *after compression* on the Workers Paid plan, and up to 3 MB on the Workers Free plan. On either plan, a Worker can be up to 64 MB *before compression*.

You can assess the size of your Worker bundle after compression by performing a dry-run with `wrangler` and reviewing the final compressed (`gzip`) size output by `wrangler`:

```sh
wrangler deploy --outdir bundled/ --dry-run
```

```sh
# Output will resemble the below:
Total Upload: 259.61 KiB / gzip: 47.23 KiB
```

Note that larger Worker bundles can impact the start-up time of the Worker, as the Worker needs to be loaded into memory.

To reduce the upload size of a Worker, consider some of the following strategies:

* Removing unnecessary dependencies and packages
* Storing configuration files, static assets, and binary data using [Workers KV](https://developers.cloudflare.com/kv/), [R2](https://developers.cloudflare.com/r2/), [D1](https://developers.cloudflare.com/d1/), or [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) instead of bundling them within your Worker code.
* Splitting functionality across multiple Workers and connecting them using [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/).

***

## Worker startup time

A Worker must be able to be parsed and execute its global scope (top-level code outside of any handlers) within 1 second. Worker size can impact startup because there is more code to parse and evaluate. Avoiding expensive code in the global scope can keep startup efficient as well.

You can measure your Worker's startup time by deploying it to Cloudflare using [Wrangler](https://developers.cloudflare.com/workers/wrangler/). When you run `npx wrangler@latest deploy` or `npx wrangler@latest versions upload`, Wrangler will output the startup time of your Worker in the command-line output, using the `startup_time_ms` field in the [Workers Script API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/) or [Workers Versions API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/).

If you are having trouble staying under this limit, consider [profiling using DevTools](https://developers.cloudflare.com/workers/observability/dev-tools/) locally to learn how to optimize your code.

When you attempt to deploy a Worker using the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/), but your deployment is rejected because your Worker exceeds the maximum startup time, Wrangler will automatically generate a CPU profile that you can import into Chrome DevTools or open directly in VSCode. You can use this to learn what code in your Worker uses large amounts of CPU time at startup. Refer to [`wrangler check startup`](https://developers.cloudflare.com/workers/wrangler/commands/#startup) for more details.

Exceeding this limit is most commonly caused by attempting to perform expensive initialization work directly in top level (global) scope, rather than either at build time or when your Worker's handler is invoked. For example, attempting to initialize an app by generating or consuming a large schema.

Need a higher limit?

To request an adjustment to a limit, complete the [Limit Increase Request Form](https://forms.gle/ukpeZVLWLnKeixDu7). If the limit can be increased, Cloudflare will contact you with next steps.

***

## Number of Workers

You can have up to 500 Workers on your account on the Workers Paid plan, and up to 100 Workers on the Workers Free plan.

If you need more than 500 Workers, consider using [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/).

***

## Routes and domains

### Number of routes per zone

Each zone has a limit of 1,000 [routes](https://developers.cloudflare.com/workers/configuration/routing/routes/). If you require more than 1,000 routes on your zone, consider using [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/).

### Number of routes per zone when using `wrangler dev --remote`

When you run a [remote development](https://developers.cloudflare.com/workers/development-testing/#remote-bindings) session using the `--remote` flag, a limit of 50 [routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) per zone is enforced. The Quick Editor in the Cloudflare Dashboard also uses `wrangler dev --remote`, so any changes made there are subject to the same 50-route limit. If your zone has more than 50 routes, you **will not be able to run a remote session**. To fix this, you must remove routes until you are under the 50-route limit.

### Number of custom domains per zone

Each zone has a limit of 100 [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). If you require more than 100 custom domains on your zone, consider using a wildcard [route](https://developers.cloudflare.com/workers/configuration/routing/routes/).

### Number of routed zones per Worker

When configuring [routing](https://developers.cloudflare.com/workers/configuration/routing/), the maximum number of zones that can be referenced by a Worker is 1,000. If you require more than 1,000 zones on your Worker, consider using [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/).

***

## Image Resizing with Workers

When using Image Resizing with Workers, refer to [Image Resizing documentation](https://developers.cloudflare.com/images/transform-images/) for more information on the applied limits.

***

## Log size

You can emit a maximum of 256 KB of data (across `console.log()` statements, exceptions, request metadata and headers) to the console for a single request. After you exceed this limit, further context associated with the request will not be recorded in logs, appear when tailing logs of your Worker, or within a [Tail Worker](https://developers.cloudflare.com/workers/observability/logs/tail-workers/).

Refer to the [Workers Trace Event Logpush documentation](https://developers.cloudflare.com/workers/observability/logs/logpush/#limits) for information on the maximum size of fields sent to logpush destinations.

***

## Unbound and Bundled plan limits

Note

Unbound and Bundled plans have been deprecated and are no longer available for new accounts.

If your Worker is on an Unbound plan, your limits are exactly the same as the Workers Paid plan.

If your Worker is on a Bundled plan, your limits are the same as the Workers Paid plan except for the following differences:

* Your limit for [subrequests](https://developers.cloudflare.com/workers/platform/limits/#subrequests) is 50/request
* Your limit for [CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time) is 50ms for HTTP requests and 50ms for [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
* You have no [Duration](https://developers.cloudflare.com/workers/platform/limits/#duration) limits for [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/), or [Queue consumers](https://developers.cloudflare.com/queues/configuration/javascript-apis/#consumer)
* Your Cache API limits for calls/requests is 50

***

## Static Assets

### Files

There is a 20,000 file count limit per [Worker version](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/) for free users, and a 100,000 file count limit for paid users.

There is a 25 MiB individual file size limit for all users.

Note

To use the increased limits in Wrangler you must use version 4.34.0 or higher.

### Headers

A `_headers` file may contain up to 100 rules and each line may contain up to 2,000 characters. The entire line, including spacing, header name, and value, counts towards this limit.

### Redirects

A `_redirects` file may contain up to 2,000 static redirects and 100 dynamic redirects, for a combined total of 2,100 redirects. Each redirect declaration has a 1,000-character limit.

***

## Related resources

Review other developer platform resource limits.

* [KV limits](https://developers.cloudflare.com/kv/platform/limits/)
* [Durable Object limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
* [Queues limits](https://developers.cloudflare.com/queues/platform/limits/)
