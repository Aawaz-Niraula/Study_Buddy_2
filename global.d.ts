// Add minimal declaration for pdf-parse to satisfy TypeScript.
// This keeps the runtime usage but tells TS to treat the module as any.

declare module 'pdf-parse' {
  /*
    If you want stronger types later, replace `any` with a proper interface
    or install @types/pdf-parse if it becomes available.
  */
  const parse: any;
  export default parse;
}
