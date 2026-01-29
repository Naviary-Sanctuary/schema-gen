export const SUPPORTED_GENERATORS = ['elysia', 'typebox'] as const;
export type SupportedGeneratorType = (typeof SUPPORTED_GENERATORS)[number];
