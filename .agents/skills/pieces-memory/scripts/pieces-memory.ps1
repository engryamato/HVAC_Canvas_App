param(
  [ValidateSet("Ask", "Remember", "ListTools")]
  [string]$Action = "Ask",

  [string]$Question = "",
  [string]$Topics = "",
  [string]$SummaryDescription = "",
  [string]$Summary = "",
  [string]$Project = "C:\Users\User\Downloads\GitHub\HVAC_Canvas_App",
  [string]$Files = "",
  [string]$Endpoint = "http://localhost:39300/model_context_protocol/2025-03-26/mcp"
)

$ErrorActionPreference = "Stop"

function Invoke-Mcp {
  param(
    [string]$Method,
    [hashtable]$Params = @{},
    [hashtable]$Headers = @{},
    [int]$Id = 1
  )

  $body = @{
    jsonrpc = "2.0"
    id = $Id
    method = $Method
    params = $Params
  } | ConvertTo-Json -Depth 30

  Invoke-WebRequest `
    -Uri $Endpoint `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -Headers $Headers `
    -UseBasicParsing `
    -TimeoutSec 60
}

function Convert-CsvList {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return @()
  }

  return $Value.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

$baseHeaders = @{ Accept = "application/json, text/event-stream" }
$initParams = @{
  protocolVersion = "2025-03-26"
  capabilities = @{}
  clientInfo = @{
    name = "codex-pieces-memory"
    version = "1.0.0"
  }
}

$init = Invoke-Mcp -Method "initialize" -Params $initParams -Headers $baseHeaders -Id 1
$sessionId = $init.Headers["mcp-session-id"]

if ([string]::IsNullOrWhiteSpace($sessionId)) {
  throw "Pieces MCP initialize did not return mcp-session-id."
}

$headers = @{
  Accept = "application/json, text/event-stream"
  "mcp-session-id" = $sessionId
}

$initializedBody = @{
  jsonrpc = "2.0"
  method = "notifications/initialized"
  params = @{}
} | ConvertTo-Json -Depth 10

try {
  Invoke-WebRequest `
    -Uri $Endpoint `
    -Method Post `
    -Body $initializedBody `
    -ContentType "application/json" `
    -Headers $headers `
    -UseBasicParsing `
    -TimeoutSec 10 | Out-Null
} catch {
  # Some Pieces builds return no content for notifications. Continue after initialize.
}

if ($Action -eq "ListTools") {
  $response = Invoke-Mcp -Method "tools/list" -Params @{} -Headers $headers -Id 2
  $response.Content
  exit 0
}

if ($Action -eq "Ask") {
  if ([string]::IsNullOrWhiteSpace($Question)) {
    throw "-Question is required for -Action Ask."
  }

  $arguments = @{
    question = $Question
    topics = @(Convert-CsvList -Value $Topics)
    application_sources = @()
    open_files = @()
    chat_llm = "GPT-5 Codex"
    related_questions = @()
  }

  $params = @{
    name = "ask_pieces_ltm"
    arguments = $arguments
  }

  $response = Invoke-Mcp -Method "tools/call" -Params $params -Headers $headers -Id 3
  $response.Content
  exit 0
}

if ($Action -eq "Remember") {
  if ([string]::IsNullOrWhiteSpace($SummaryDescription)) {
    throw "-SummaryDescription is required for -Action Remember."
  }

  if ([string]::IsNullOrWhiteSpace($Summary)) {
    throw "-Summary is required for -Action Remember."
  }

  $arguments = @{
    summary_description = $SummaryDescription
    summary = $Summary
    project = $Project
    files = @(Convert-CsvList -Value $Files)
    externalLinks = @()
    connected_client = "ChatGPT Codex"
  }

  $params = @{
    name = "create_pieces_memory"
    arguments = $arguments
  }

  $response = Invoke-Mcp -Method "tools/call" -Params $params -Headers $headers -Id 4
  $response.Content
  exit 0
}
