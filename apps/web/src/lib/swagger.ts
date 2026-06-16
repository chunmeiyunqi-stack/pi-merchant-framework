import { createSwaggerSpec } from 'next-swagger-doc';
// createSwaggerSpec has no precise types in this project; allow any usage
import fs from 'fs';
import path from 'path';

export const getApiDocs = () => {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'out/openapi_v2.0.0.json'),
      path.resolve(process.cwd(), '../out/openapi_v2.0.0.json'),
      path.resolve(process.cwd(), '../../out/openapi_v2.0.0.json'),
      path.resolve(process.cwd(), 'apps/web/public/openapi.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
  } catch (_e) {
    // ignore
  }

  const apiFolder = path.resolve(process.cwd(), 'apps/web/src/app/api');
  return createSwaggerSpec({
    apiFolder,
    definition: {
      openapi: '3.0.0',
      info: { title: '先锋人工智能服务框架 API V2.0.0', version: '2.0.0' },
    },
  });
};
