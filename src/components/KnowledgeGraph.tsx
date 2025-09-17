import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KnowledgeGraphProps {
    projectId: string;
    searchQuery?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    type: string;
    group: number;
    package?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    value: number;
}

interface GraphApiResponse {
    nodes: {
        id: string;
        properties: {
            name?: string;
            type?: string;
            package?: string;
        };
    }[];
    edges: {
        from: string;
        to: string;
        type: string;
    }[];
}

export default function KnowledgeGraph({ projectId, searchQuery }: KnowledgeGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);

    const { data: graphData, isLoading } = useQuery<GraphApiResponse>({
        queryKey: ["/api/projects", projectId, "graph"],
        enabled: !!projectId,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!graphData || !svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const width = 800;
        const height = 400;

        // Clear previous content
        svg.selectAll("*").remove();

        // Transform API data to D3 format
        const nodes: GraphNode[] = graphData?.nodes.map((node: any) => ({
            id: node.id,
            name: node.properties.name || node.id,
            type: node.properties.type || 'unknown',
            package: node.properties.package,
            group: getNodeGroup(node.properties.type)
        }));

        const links: GraphLink[] = graphData?.edges.map((edge: any) => ({
            source: edge.from,
            target: edge.to,
            type: edge.type,
            value: 1
        }));

        // Create simulation
        const sim = d3.forceSimulation<GraphNode>(nodes)
            .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(25));

        setSimulation(sim);

        // Create container groups
        const container = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Create links
        const link = container.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', 'hsl(215 16% 57%)')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Create nodes
        const node = container.append('g')
            .selectAll<SVGCircleElement, GraphNode>('circle')
            .data(nodes)
            .join('circle')
            .attr('r', d => getNodeRadius(d.type))
            .attr('fill', d => getNodeColor(d.type))
            .attr('stroke', 'hsl(220 13% 18%)')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(
                d3.drag<SVGCircleElement, GraphNode>()
                    .on('start', (event, d) => {
                        if (!event.active) sim.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on('drag', (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on('end', (event, d) => {
                        if (!event.active) sim.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            );

        // Add node labels
        const labels = container.append('g')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .text(d => d.name)
            .attr('font-size', '12px')
            .attr('fill', 'hsl(210 40% 95%)')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('pointer-events', 'none');

        // Node click handler
        node.on('click', (event, d) => {
            setSelectedNode(d);
            event.stopPropagation();
        });

        // Update positions on simulation tick
        sim.on('tick', () => {
            link
                .attr('x1', d => (d.source as GraphNode).x!)
                .attr('y1', d => (d.source as GraphNode).y!)
                .attr('x2', d => (d.target as GraphNode).x!)
                .attr('y2', d => (d.target as GraphNode).y!);

            node
                .attr('cx', d => d.x!)
                .attr('cy', d => d.y!);

            labels
                .attr('x', d => d.x!)
                .attr('y', d => d.y! + 25);
        });

        // Cleanup
        return () => {
            sim.stop();
        };
    }, [graphData]);

    const resetZoom = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.transition()
            .duration(750)
            .call(
                d3.zoom<SVGSVGElement, unknown>().transform,
                d3.zoomIdentity
            );
    };

    const exportGraph = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'knowledge-graph.svg';
        link.click();

        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-muted-foreground">Loading knowledge graph...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!graphData || !graphData.nodes.length) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center text-muted-foreground">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <p className="text-lg">No graph data available</p>
                            <p className="text-sm mt-2">Analyze the project to generate knowledge graph</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Knowledge Graph</h3>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetZoom}
                                data-testid="button-reset-zoom"
                            >
                                Reset Zoom
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportGraph}
                                data-testid="button-export-graph"
                            >
                                Export
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <svg
                            ref={svgRef}
                            width="100%"
                            height="400"
                            className="border border-border rounded-md bg-card"
                            data-testid="knowledge-graph-svg"
                        />
                        {selectedNode && (
                            <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">{selectedNode.name}</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedNode(null)}
                                    >
                                        x
                                    </Button>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="secondary">{selectedNode.type}</Badge>
                                    </div>
                                    {selectedNode.package && (
                                        <div>
                                            <span className="text-muted-foreground">Package:</span>
                                            <span className="ml-1">{selectedNode.package}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span>Functions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-secondary"></div>
                            <span>Structs</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-accent"></div>
                            <span>Interfaces</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                            <span>Variables</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function getNodeGroup(type: string): number {
    switch (type) {
        case 'function':
        case 'method':
            return 1;
        case 'struct':
        case 'class':
            return 2;
        case 'interface':
            return 3;
        default:
            return 4;
    }
}

function getNodeRadius(type: string): number {
    switch (type) {
        case 'function':
        case 'method':
            return 8;
        case 'struct':
        case 'class':
            return 10;
        case 'interface':
            return 8;
        default:
            return 6;
    }
}

function getNodeColor(type: string): string {
    switch (type) {
        case 'function':
        case 'method':
            return 'hsl(210 100% 56%)'; // primary
        case 'struct':
        case 'class':
            return 'hsl(291 47% 51%)'; // secondary
        case 'interface':
            return 'hsl(122 39% 49%)'; // accent
        default:
            return 'hsl(215 16% 57%)'; // muted-foreground
    }
}
