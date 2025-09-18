import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface ProjectUploadProps {
    onSuccess?: () => void;
}

export default function ProjectUpload({ onSuccess }: ProjectUploadProps) {
    const [projectName, setProjectName] = useState("");
    const [projectPath, setProjectPath] = useState("");
    const [language, setLanguage] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<FileList | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const createProjectMutation = useMutation({
        mutationFn: api.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            toast.success("Project Created Successfully");
            onSuccess?.();
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create project");
        },
    });

    const resetForm = () => {
        setProjectName("");
        setProjectPath("");
        setLanguage("");
        setDescription("");
        setFiles(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName || !language) {
            toast.error("Validation Error", {
                description: "Please fill in all required fields",
            });
            return;
        }

        createProjectMutation.mutate({
            name: projectName,
            path: projectPath || `/projects/${projectName.toLowerCase().replace(/\s+/g, '-')}`,
            language,
            statistics: {
                totalFiles: 0,
                totalLines: 0,
                totalFunctions: 0,
                totalStructs: 0,
                elementCounts: {},
                packageCounts: {}
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        setFiles(selectedFiles);

        if (selectedFiles && selectedFiles.length > 0) {
            const extensions = Array.from(selectedFiles).map(file =>
                file.name.split('.').pop()?.toLowerCase()
            );

            if (extensions.some(ext => ext === 'go')) {
                setLanguage('go');
            } else if (extensions.some(ext => ['ts', 'tsx', 'js', 'jsx'].includes(ext || ''))) {
                setLanguage('typescript');
            } else if (extensions.some(ext => ext === 'py')) {
                setLanguage('python');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Upload Project</h2>
                <p className="text-sm text-muted-foreground">
                    Create a new project for code analysis and semantic search
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="my-awesome-project"
                        required
                        data-testid="input-project-name"
                    />
                </div>

                <div>
                    <Label htmlFor="project-path">Project Path</Label>
                    <Input
                        id="project-path"
                        value={projectPath}
                        onChange={(e) => setProjectPath(e.target.value)}
                        placeholder="/workspace/my-awesome-project"
                        data-testid="input-project-path"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Optional: Specify the project path. Will auto-generate if empty.
                    </p>
                </div>

                <div>
                    <Label htmlFor="language">Primary Language *</Label>
                    <Select value={language} onValueChange={setLanguage} required>
                        <SelectTrigger data-testid="select-language">
                            <SelectValue placeholder="Select primary language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="go">Go</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="files">Project Files</Label>
                    <Input
                        ref={fileInputRef}
                        id="files"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="cursor-pointer"
                        data-testid="input-files"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Select a folder containing your project files. The system will analyze supported file types.
                    </p>
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of your project..."
                        rows={3}
                        data-testid="textarea-description"
                    />
                </div>

                {files && files.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Selected Files</h4>
                        <p className="text-sm text-muted-foreground">
                            {files.length} files selected
                        </p>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                            <div className="text-xs space-y-1">
                                {Array.from(files).slice(0, 10).map((file, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span className="truncate">{file.name}</span>
                                        <span className="text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)}KB
                                        </span>
                                    </div>
                                ))}
                                {files.length > 10 && (
                                    <div className="text-muted-foreground">
                                        ... and {files.length - 10} more files
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={createProjectMutation.isPending}
                        data-testid="button-cancel"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createProjectMutation.isPending || !projectName || !language}
                        data-testid="button-create"
                    >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
