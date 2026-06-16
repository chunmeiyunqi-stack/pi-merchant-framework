declare module 'swagger-ui-react' {
  const SwaggerUI: any;
  export default SwaggerUI;
}

declare module 'next-swagger-doc' {
  export function createSwaggerSpec(...args: any[]): any;
}

declare module 'docx' {
  export const Document: any;
  export const Packer: any;
  export const Paragraph: any;
  export const TextRun: any;
}
