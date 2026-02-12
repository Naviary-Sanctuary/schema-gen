export const SUPPORTED_GENERATORS = ['elysia', 'typebox', 'zod'] as const;
export type SupportedGeneratorType = (typeof SUPPORTED_GENERATORS)[number];
