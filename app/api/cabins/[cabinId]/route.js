export async function GET({ params }, request) {
  const { cabinId } = params;
  return Response.json({ test: "test" });
}
