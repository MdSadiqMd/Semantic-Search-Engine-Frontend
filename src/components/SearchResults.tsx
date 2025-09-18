import { useSearch } from "@/hooks/useSearch";
import CodeSnippet from "./CodeSnippet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
    query: string;
    filters: any;
    projectId: string;
}

export default function SearchResults({ query, filters, projectId }: SearchResultsProps) {
    const { searchResults, isLoading, hasMore, loadMore } = useSearch(query, filters);

    if (!query) {
        return (
            <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p className="text-lg">Enter a search query to find code elements</p>
                    <p className="text-sm mt-2">Try searching for "HTTP handlers" or "user validation"</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-full mb-3" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                            <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!searchResults || searchResults.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-muted-foreground">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709"></path>
                    </svg>
                    <p className="text-lg">No results found</p>
                    <p className="text-sm mt-2">Try adjusting your search query or filters</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {searchResults.map((result, index) => (
                <Card key={result.element.id} className="hover:border-primary/50 transition-all duration-200">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-primary/10 text-primary"
                                        data-testid={`badge-type-${index}`}
                                    >
                                        {result.element.type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground" data-testid={`text-location-${index}`}>
                                        {result.element.filePath}:{result.element.startLine}-{result.element.endLine}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-name-${index}`}>
                                    {result.element.name}
                                </h3>
                                {result.element.docComment && (
                                    <p className="text-sm text-muted-foreground mb-3" data-testid={`text-description-${index}`}>
                                        {result.element.docComment}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="text-sm text-muted-foreground">
                                    <span className="text-accent font-medium" data-testid={`text-similarity-${index}`}>
                                        {Math.round(result.similarity * 100)}%
                                    </span> match
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigator.clipboard.writeText(result.element.code)}
                                    title="Copy code"
                                    data-testid={`button-copy-${index}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        <CodeSnippet
                            code={result.element.code}
                            language={getLanguageFromFilePath(result.element.filePath)}
                            data-testid={`code-snippet-${index}`}
                        />

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>Package: <span className="text-foreground">{result.element.package}</span></span>
                                <span>Lines: <span className="text-foreground">{result.element.endLine - result.element.startLine + 1}</span></span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {result.matches && result.matches.map((match: any, matchIndex: any) => (
                                    <Badge key={matchIndex} variant="outline" className="text-xs">
                                        {match}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {hasMore && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        data-testid="button-load-more"
                    >
                        Load More Results
                    </Button>
                </div>
            )}
        </div>
    );
}

function getLanguageFromFilePath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'go':
            return 'go';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'py':
            return 'python';
        default:
            return 'text';
    }
}
