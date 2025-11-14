export default function Canvas({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div>
      <h1>Canvas: {params.projectId}</h1>
      <p>Week 3 implementation - Canvas drawing and tools</p>
    </div>
  )
}

