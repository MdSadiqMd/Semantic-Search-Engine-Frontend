import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";

interface SearchPanelProps {
    projectId: string;
    onSearch: (query: string, filters: any) => void;
}

interface ProjectStats {
    totalElements: number;
    elementCounts: {
        function?: number;
        struct?: number;
        interface?: number;
        method?: number;
    };
    packageCounts: Record<string, number>;
}

export default function SearchPanel({ projectId, onSearch }: SearchPanelProps) {
    const [query, setQuery] = useState("");
    const [fileType, setFileType] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");
    const [elementTypes, setElementTypes] = useState<string[]>(["function"]);
    const [threshold, setThreshold] = useState([0.7]);

    const { data: stats } = useQuery<ProjectStats>({
        queryKey: ["/api/projects", projectId, "stats"],
        queryFn: api.getProjects,
        enabled: !!projectId,
    });

    const handleSearch = () => {
        if (!query.trim()) return;

        const filters = {
            projectId,
            fileType: fileType && fileType !== 'all' ? fileType : undefined,
            package: packageFilter && packageFilter !== 'all' ? packageFilter : undefined,
            elementTypes: elementTypes.length > 0 ? elementTypes : undefined,
            threshold: threshold[0],
        };

        onSearch(query, filters);
    };

    const handleElementTypeChange = (type: string, checked: boolean) => {
        if (checked) {
            setElementTypes([...elementTypes, type]);
        } else {
            setElementTypes(elementTypes.filter(t => t !== type));
        }
    };

    return (
        <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
            <div className="space-y-6">
                <div>
                    <Label className="block text-sm font-medium mb-2">Semantic Search</Label>
                    <div className="relative">
                        <svg className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <Input
                            placeholder="find functions that handle HTTP requests"
                            className="pl-10"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            data-testid="input-search"
                        />
                    </div>
                    <Button
                        className="w-full mt-2"
                        onClick={handleSearch}
                        disabled={!query.trim()}
                        data-testid="button-search"
                    >
                        Search Codebase
                    </Button>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Filters</h3>
                    <div className="space-y-3">
                        <div>
                            <Label className="block text-xs text-muted-foreground mb-1">File Type</Label>
                            <Select value={fileType} onValueChange={setFileType}>
                                <SelectTrigger data-testid="select-filetype">
                                    <SelectValue placeholder="All Files" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Files</SelectItem>
                                    <SelectItem value="go">Go (.go)</SelectItem>
                                    <SelectItem value="typescript">TypeScript (.ts)</SelectItem>
                                    <SelectItem value="python">Python (.py)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="block text-xs text-muted-foreground mb-1">Element Type</Label>
                            <div className="space-y-2">
                                {[
                                    { id: "function", label: "Functions" },
                                    { id: "struct", label: "Structs" },
                                    { id: "interface", label: "Interfaces" },
                                    { id: "method", label: "Methods" }
                                ].map((type) => (
                                    <label key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={elementTypes.includes(type.id)}
                                            onCheckedChange={(checked) => handleElementTypeChange(type.id, !!checked)}
                                            data-testid={`checkbox-${type.id}`}
                                        />
                                        <span className="text-sm">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="block text-xs text-muted-foreground mb-1">Similarity Threshold</Label>
                            <Slider
                                value={threshold}
                                onValueChange={setThreshold}
                                max={1}
                                min={0}
                                step={0.1}
                                className="w-full"
                                data-testid="slider-threshold"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>0.0</span>
                                <span data-testid="text-threshold">{threshold[0]}</span>
                                <span>1.0</span>
                            </div>
                        </div>

                        <div>
                            <Label className="block text-xs text-muted-foreground mb-1">Package</Label>
                            <Select value={packageFilter} onValueChange={setPackageFilter}>
                                <SelectTrigger data-testid="select-package">
                                    <SelectValue placeholder="All Packages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Packages</SelectItem>
                                    <SelectItem value="main">main</SelectItem>
                                    <SelectItem value="internal/api">internal/api</SelectItem>
                                    <SelectItem value="internal/service">internal/service</SelectItem>
                                    <SelectItem value="pkg/utils">pkg/utils</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium mb-3">Project Statistics</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Elements</span>
                                <span data-testid="stat-elements">{stats.totalElements || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Functions</span>
                                <span data-testid="stat-functions">{stats.elementCounts?.function || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Structs</span>
                                <span data-testid="stat-structs">{stats.elementCounts?.struct || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Packages</span>
                                <span data-testid="stat-packages">{Object.keys(stats.packageCounts || {}).length}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
