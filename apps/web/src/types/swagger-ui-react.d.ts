// Type declaration for swagger-ui-react (no official @types package)
declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react';

  interface SwaggerUIProps {
    url?: string;
    spec?: Record<string, unknown>;
    layout?: string;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelExpandDepth?: number;
    displayRequestDuration?: boolean;
    filter?: boolean | string;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tryItOutEnabled?: boolean;
    requestInterceptor?: (req: Record<string, unknown>) => Record<string, unknown>;
    responseInterceptor?: (res: Record<string, unknown>) => Record<string, unknown>;
    onComplete?: () => void;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
