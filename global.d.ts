declare module 'pdf-parse' {
  const parse: (input: Buffer | Uint8Array | string, options?: Record<string, unknown>) => Promise<unknown>;
  export default parse;
}
