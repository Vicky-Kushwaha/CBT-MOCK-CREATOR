export default function McpGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Connect with Claude via MCP</h1>
        <p className="mt-2 text-lg text-slate-600">Connect your local mock test data directly to Claude using the Model Context Protocol (MCP).</p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-800">What is MCP?</h2>
        <p className="mb-6 text-slate-600 leading-relaxed">
          The Model Context Protocol (MCP) allows AI models like Claude to directly access and interact with the data in your MockMaster. 
          By configuring Claude with our custom MCP Server, Claude can automatically answer your queries about exams, subjects, analytics, and dynamically generate or review questions using your database!
        </p>

        <h2 className="mb-4 text-xl font-bold text-slate-800">How to Connect</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">1</div>
            <div>
              <h3 className="font-bold text-slate-800">Ensure the MCP Server is running</h3>
              <p className="mt-1 text-sm text-slate-600">
                The MCP server runs automatically when you start this application using Docker (`docker compose up`).
                It listens for SSE connections at <code className="rounded bg-slate-100 px-1.5 py-0.5 text-indigo-600 font-mono">http://localhost:8811/sse</code>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">2</div>
            <div>
              <h3 className="font-bold text-slate-800">Configure Claude Desktop (or other MCP client)</h3>
              <p className="mt-1 text-sm text-slate-600 mb-3">
                In your Claude Desktop configuration file (usually located at <code>~/.claude/claude_desktop_config.json</code> or similar depending on OS), add the following entry:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-50">
{`{
  "mcpServers": {
    "cbt-mock-creator": {
      "command": "docker",
      "args": [
        "compose",
        "exec",
        "-T",
        "mcp",
        "python",
        "-m",
        "apps.mcp.server"
      ]
    }
  }
}`}
              </pre>
              <p className="mt-3 text-sm text-slate-500 italic">
                Note: Alternatively, if you are using an HTTP SSE connector in a custom client, simply paste the URL <code>http://localhost:8811/sse</code> without any query parameters.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">3</div>
            <div>
              <h3 className="font-bold text-slate-800">Restart Claude</h3>
              <p className="mt-1 text-sm text-slate-600">
                Restart your Claude Desktop application. You will see a new tool integration icon confirming that Claude is successfully connected to the MockMaster database!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
