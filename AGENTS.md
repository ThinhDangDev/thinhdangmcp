# MCP Transport Methods Overview

**STDIO (Standard Input/Output)**

- Communicates directly using the process's stdin and stdout streams.
- **Ideal for:** Command-line interfaces, desktop applications, IDE extensions.
- **Advantages:** Extremely simple, minimal latency, no network involved.
- **Limitations:** One connection at a time; only works locally.

**SSE (Server-Sent Events)**

- Sends data one-way from server to client using HTTP streaming.
- **Ideal for:** Web applications needing real-time updates, such as notifications.
- **Advantages:** Automatic reconnection, firewall-friendly, uses standard HTTP.
- **Limitations:** Only server-to-client communication; client-to-server requires workarounds like polling.

**HTTP (StreamableHttp)**

- Standard HTTP request and response pattern.
- **Ideal for:** REST APIs, distributed systems, microservice communications.
- **Advantages:** Stateless, highly compatible, scalable, works over any network.
- **Limitations:** More overhead; typically not real-time; increased latency per request.

**Summary:**

- **STDIO** = local process pipes
- **SSE** = real-time server-to-client streaming
- **HTTP** = universal client-server web communication
