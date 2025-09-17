import { sql } from "drizzle-orm";
import {
    pgTable,
    text,
    varchar,
    integer,
    timestamp,
    jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    path: text("path").notNull(),
    language: text("language").notNull(),
    statistics: jsonb("statistics").$type<{
        totalFiles: number;
        totalLines: number;
        totalFunctions: number;
        totalStructs: number;
        elementCounts: Record<string, number>;
        packageCounts: Record<string, number>;
    }>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeElements = pgTable("code_elements", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: varchar("project_id").references(() => projects.id).notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    filePath: text("file_path").notNull(),
    startLine: integer("start_line").notNull(),
    endLine: integer("end_line").notNull(),
    package: text("package"),
    signature: text("signature"),
    docComment: text("doc_comment"),
    code: text("code").notNull(),
    embedding: jsonb("embedding").$type<number[]>(), // float32[] in Go
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const relationships = pgTable("relationships", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fromId: varchar("from_id").references(() => codeElements.id).notNull(),
    toId: varchar("to_id").references(() => codeElements.id).notNull(),
    type: text("type").notNull(),
    properties: jsonb("properties").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const searchQueries = pgTable("search_queries", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: varchar("project_id").references(() => projects.id).notNull(),
    query: text("query").notNull(),
    filters: jsonb("filters").$type<Record<string, any>>(),
    limit: integer("limit").default(10),
    threshold: jsonb("threshold").$type<number>(), // float64
    includeMetadata: jsonb("include_metadata").$type<boolean>().default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const analysisJobs = pgTable("analysis_jobs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: varchar("project_id").references(() => projects.id).notNull(),
    status: text("status").notNull().default("pending"),
    progress: integer("progress").default(0),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertCodeElementSchema = createInsertSchema(codeElements).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
    id: true,
    createdAt: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
    id: true,
    createdAt: true,
});

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type CodeElement = typeof codeElements.$inferSelect;
export type InsertCodeElement = z.infer<typeof insertCodeElementSchema>;

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;

export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;

export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;

export interface SearchResult {
    element: CodeElement;
    score: number;
    similarity: number;
    matches: string[];
    highlights?: Highlight[];
}

export interface Highlight {
    field: string;
    start: number;
    end: number;
    text: string;
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    query: string;
    took: number;
    filters: Record<string, any>;
}

export interface GraphNode {
    id: string;
    labels: string[];
    properties: Record<string, any>;
}

export interface GraphEdge {
    id: string;
    from: string;
    to: string;
    type: string;
    properties: Record<string, any>;
}

export interface KnowledgeGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
