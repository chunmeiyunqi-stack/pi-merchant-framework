import client from '../../../lib/metrics';

export async function GET() {
  try {
    const metrics = await client.register.metrics();
    return new Response(metrics, {
      status: 200,
      headers: { 'Content-Type': client.register.contentType },
    });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
