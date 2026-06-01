param(
  [ValidateSet("Summary", "Search", "Neighbors", "Memory")]
  [string]$Action = "Summary",

  [string]$Query = "",
  [string]$NodeId = "",
  [string]$AppRoot = "C:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app"
)

$ErrorActionPreference = "Stop"

$graphPath = Join-Path $AppRoot ".understand-anything\knowledge-graph.json"
$memoryRoot = Join-Path $AppRoot ".understand-anything\memory"

if (-not (Test-Path -LiteralPath $graphPath)) {
  throw "Understand Anything graph not found: $graphPath"
}

$graph = Get-Content -Raw -LiteralPath $graphPath | ConvertFrom-Json

function Write-Node {
  param($Node)

  [pscustomobject]@{
    id = $Node.id
    type = $Node.type
    name = $Node.name
    filePath = $Node.filePath
    complexity = $Node.complexity
    tags = if ($Node.tags) { ($Node.tags -join ",") } else { "" }
    summary = $Node.summary
  }
}

if ($Action -eq "Summary") {
  [pscustomobject]@{
    project = $graph.project.name
    description = $graph.project.description
    analyzedAt = $graph.project.analyzedAt
    version = $graph.version
    nodeCount = @($graph.nodes).Count
    edgeCount = @($graph.edges).Count
    layers = (($graph.layers | ForEach-Object { "$($_.name):$(@($_.nodeIds).Count)" }) -join "; ")
  } | Format-List
  exit 0
}

if ($Action -eq "Search") {
  if ([string]::IsNullOrWhiteSpace($Query)) {
    throw "-Query is required for -Action Search."
  }

  $pattern = [regex]::Escape($Query)
  $graph.nodes |
    Where-Object {
      ($_.id -match $pattern) -or
      ($_.name -match $pattern) -or
      ($_.filePath -match $pattern) -or
      ($_.summary -match $pattern) -or
      (($_.tags -join " ") -match $pattern)
    } |
    Select-Object -First 30 |
    ForEach-Object { Write-Node $_ } |
    Format-Table -Wrap
  exit 0
}

if ($Action -eq "Neighbors") {
  if ([string]::IsNullOrWhiteSpace($NodeId)) {
    throw "-NodeId is required for -Action Neighbors."
  }

  $nodesById = @{}
  foreach ($node in $graph.nodes) {
    $nodesById[$node.id] = $node
  }

  $graph.edges |
    Where-Object { $_.source -eq $NodeId -or $_.target -eq $NodeId } |
    Select-Object -First 50 |
    ForEach-Object {
      $otherId = if ($_.source -eq $NodeId) { $_.target } else { $_.source }
      $other = $nodesById[$otherId]
      [pscustomobject]@{
        direction = if ($_.source -eq $NodeId) { "out" } else { "in" }
        type = $_.type
        otherId = $otherId
        otherPath = if ($other) { $other.filePath } else { "" }
        otherSummary = if ($other) { $other.summary } else { "" }
      }
    } |
    Format-Table -Wrap
  exit 0
}

if ($Action -eq "Memory") {
  $files = @(
    "MEMORY.md",
    "project-overview.md",
    "features-recent.md",
    "features-planned.md",
    "fixes-infra.md"
  )

  foreach ($file in $files) {
    $path = Join-Path $memoryRoot $file
    if (Test-Path -LiteralPath $path) {
      "===== $file ====="
      Get-Content -LiteralPath $path
      ""
    }
  }
  exit 0
}
