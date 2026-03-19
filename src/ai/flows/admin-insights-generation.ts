'use server';
/**
 * @fileOverview An AI tool for administrators to generate concise summaries and identify significant trends
 * and patterns from filtered visitor log data.
 *
 * - generateAdminInsights - A function that handles the generation of insights from visitor data.
 * - AdminInsightsGenerationInput - The input type for the generateAdminInsights function.
 * - AdminInsightsGenerationOutput - The return type for the generateAdminInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminInsightsGenerationInputSchema = z.object({
  visitorLogs: z.array(
    z.object({
      timestamp: z.string().describe('Timestamp of the visit (ISO string).'),
      reason: z.string().describe('Reason for the visit.'),
      college: z.string().describe('College of the visitor.'),
      visitorType: z.string().describe('Type of visitor (Student/Employee).'),
      isEmployee: z.boolean().describe('Whether the visitor is an employee.'),
    })
  ),
  filtersUsed: z
    .object({
      college: z.string().optional(),
      reason: z.string().optional(),
      visitorType: z.string().optional(),
    })
    .optional()
    .describe('Optional filters that were applied to the visitor logs.'),
});
export type AdminInsightsGenerationInput = z.infer<
  typeof AdminInsightsGenerationInputSchema
>;

const AdminInsightsGenerationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the visitor data.'),
  trends: z
    .array(z.string())
    .describe('A list of significant trends or patterns identified.'),
});
export type AdminInsightsGenerationOutput = z.infer<
  typeof AdminInsightsGenerationOutputSchema
>;

export async function generateAdminInsights(
  input: AdminInsightsGenerationInput
): Promise<AdminInsightsGenerationOutput> {
  return adminInsightsGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminInsightsGenerationPrompt',
  input: {schema: AdminInsightsGenerationInputSchema},
  output: {schema: AdminInsightsGenerationOutputSchema},
  prompt: `You are an AI assistant tasked with analyzing library visitor logs.

Your goal is to provide a concise summary of the provided visitor data and identify any significant trends or patterns.

Here is the visitor log data:
{{#each visitorLogs}}
- Timestamp: {{{this.timestamp}}}, Reason: {{{this.reason}}}, College: {{{this.college}}}, Visitor Type: {{{this.visitorType}}}, Is Employee: {{{this.isEmployee}}}
{{/each}}

{{#if filtersUsed}}
This data was filtered by:
{{#if filtersUsed.college}} - College: {{{filtersUsed.college}}}
{{/if}}
{{#if filtersUsed.reason}} - Reason: {{{filtersUsed.reason}}}
{{/if}}
{{#if filtersUsed.visitorType}} - Visitor Type: {{{filtersUsed.visitorType}}}
{{/if}}
{{/if}}

Please provide a concise summary and identify any trends or patterns. Focus on actionable insights.`,
});

const adminInsightsGenerationFlow = ai.defineFlow(
  {
    name: 'adminInsightsGenerationFlow',
    inputSchema: AdminInsightsGenerationInputSchema,
    outputSchema: AdminInsightsGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
