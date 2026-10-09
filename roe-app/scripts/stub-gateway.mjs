// Stub OpenAI-compatible server mimicking OmniRoute for adapter tests:
// canned reply + X-OmniRoute-Decision header. Not part of the app.
import { createServer } from "node:http";

const server = createServer((req, res) => {
  if (req.url === "/v1/models") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: [{ id: "auto" }] }));
    return;
  }
  if (req.url === "/v1/chat/completions") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "X-OmniRoute-Decision": "strategy=auto provider=stub latency=3ms",
    });
    res.end(
      JSON.stringify({
        model: "auto",
        choices: [{ message: { content: "Welcome, Ana! We're glad you're here. Join us this Friday?" } }],
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(20199, () => console.log("stub on 20199"));
