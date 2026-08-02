import { z } from "zod";

export const tutorSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "O nome completo deve ter no mínimo 3 caracteres." }),
  phone: z
    .string()
    .min(10, { message: "Informe um número de telefone/WhatsApp válido." }),
});

export const petSchema = z.object({
  name: z
    .string()
    .min(2, { message: "O nome do pet deve ter no mínimo 2 caracteres." }),
  species: z.string(),
  breed: z.string().optional(),
  gender: z.enum(["Macho", "Fêmea"]),
  ageYears: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1})?$/.test(val), {
      message: "Idade deve conter um ponto e 1 casa decimal (ex: 2.5).",
    }),
  weight: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1})?$/.test(val), {
      message: "Peso deve conter um ponto e 1 casa decimal (ex: 2.5).",
    }),
  notes: z.string().optional(),
});
