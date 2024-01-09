import { type NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ prefix: 'nextjs_node_server_' });

async function handler(_: NextRequest) {
    const metrics = await register.metrics();

    const response = new NextResponse(metrics)
    response.headers.set('Content-Type', register.contentType)
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
}

export { handler as GET, handler as POST };