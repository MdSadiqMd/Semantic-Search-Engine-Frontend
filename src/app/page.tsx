"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import SearchPanel from "@/components/SearchPanel";
import SearchResults from "@/components/SearchResults";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import ProjectUpload from "@/components/ProjectUpload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type Project } from "@/shared/schema";

type ViewMode = "list" | "graph";

export default function Home() {
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilters, setSearchFilters] = useState({});
    const [showUpload, setShowUpload] = useState(false);

    const { data: projects = [] } = useQuery<Project[]>({
        queryKey: ["/api/projects"],
        queryFn: api.getProjects
    });

    useWebSocket();

    if (!selectedProject && projects && projects.length > 0) {
        setSelectedProject(projects[0].id);
    }

    const handleSearch = (query: string, filters: any) => {
        setSearchQuery(query);
        setSearchFilters(filters);
    };

    const handleAnalyzeProject = async () => {
        if (!selectedProject) return;
        try {
            await api.analyzeProject(selectedProject);
            toast.success("Project Analyzed");
        } catch (error) {
            console.error("Failed to start analysis:", error);
        }
    };

    return (
        <div className="min-h-screen">
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                    </svg>
                                </div>
                                <h1 className="text-xl font-semibold">Code Discovery Engine</h1>
                            </div>
                            <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">Beta</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <select
                                    className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    data-testid="project-selector"
                                >
                                    <option value="">Select Project</option>
                                    {projects?.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Dialog open={showUpload} onOpenChange={setShowUpload}>
                                <DialogTrigger asChild>
                                    <Button data-testid="button-upload">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        Upload Project
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <ProjectUpload onSuccess={() => setShowUpload(false)} />
                                </DialogContent>
                            </Dialog>

                            <Button variant="ghost" size="icon" data-testid="button-settings">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <SearchPanel
                            projectId={selectedProject}
                            onSearch={handleSearch}
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-muted-foreground">
                                        {searchQuery && (
                                            <>
                                                Search results for <span className="font-medium text-primary">"{searchQuery}"</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="flex bg-muted rounded-lg p-1">
                                    <button
                                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${viewMode === "list"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        onClick={() => setViewMode("list")}
                                        data-testid="button-view-list"
                                    >
                                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                                        </svg>
                                        List
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${viewMode === "graph"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        onClick={() => setViewMode("graph")}
                                        data-testid="button-view-graph"
                                    >
                                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                        </svg>
                                        Graph
                                    </button>
                                </div>
                            </div>

                            {viewMode === "list" ? (
                                <SearchResults
                                    query={searchQuery}
                                    filters={searchFilters}
                                    projectId={selectedProject}
                                />
                            ) : (
                                <KnowledgeGraph
                                    projectId={selectedProject}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
                <Button
                    size="icon"
                    className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full shadow-lg hover:bg-secondary/90 transition-all duration-200 hover:scale-110"
                    onClick={handleAnalyzeProject}
                    disabled={!selectedProject}
                    data-testid="button-analyze"
                    title="Analyze Current Project"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </Button>

                <Button
                    size="icon"
                    className="w-12 h-12 bg-accent text-accent-foreground rounded-full shadow-lg hover:bg-accent/90 transition-all duration-200 hover:scale-110"
                    data-testid="button-chat"
                    title="AI Assistant"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                </Button>
            </div>
        </div>
    );
}
