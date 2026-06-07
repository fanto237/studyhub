import { fr } from './fr';

type WidenLiteral<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly WidenLiteral<Item>[]
        : T extends object
          ? { readonly [Key in keyof T]: WidenLiteral<T[Key]> }
          : T;

export type TranslationSchema = WidenLiteral<typeof fr>;
export type TranslationDictionary = typeof fr;
