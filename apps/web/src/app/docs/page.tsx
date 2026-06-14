'use client';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false }) as unknown as any;

export default function ApiDocsPage() {
  return (
    <div style={{ padding: 16 }}>
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
