'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MapData, NodeData } from '@/app/dashboard/map/[mapId]/page';
import { supabase } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/client';
import NodeEditModal from './NodeEditModal';

import {
  Star,
  Sun,
  Flag,
  TrendingUp,
  TrendingDown,
  Crosshair,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';

const nodePositions: { [key: string]: { top: string; left: string } } = {
  origin: { top: '10%', left: '50%' },      // node-origin
  vision: { top: '30%', left: '25%' },      // node-vision
  strategy: { top: '30%', left: '75%' },     // node-strategy
  resource: { top: '50%', left: '25%' },     // node-resources
  obstacle: { top: '50%', left: '75%' },     // node-obstacles
  purpose: { top: '70%', left: '50%' },      // node-crucible (arbitrary mapping)
  value: { top: '90%', left: '25%' },        // node-epiphany (arbitrary mapping)
  action: { top: '90%', left: '75%' },       // node-transformation (arbitrary mapping)
};

const links = [
  { from: 'origin', to: 'vision' }, { from: 'origin', to: 'strategy' },
  { from: 'vision', to: 'resource' }, { from: 'strategy', to: 'obstacle' },
  { from: 'resource', to: 'purpose' }, { from: 'obstacle', to: 'purpose' }, // Both resource and obstacle link to purpose (crucible position)
  { from: 'purpose', to: 'value' }, { from: 'purpose', to: 'action' }, // Purpose links to value and action
  { from: 'value', to: 'action' } // Value links to action
];

const nodeIconMap: { [key: string]: { icon: React.ElementType; color: string } } = {
  origin: { icon: Star, color: 'text-purple-500' },
  vision: { icon: Sun, color: 'text-sky-500' },
  strategy: { icon: Flag, color: 'text-green-500' },
  resource: { icon: TrendingUp, color: 'text-teal-500' },
  obstacle: { icon: TrendingDown, color: 'text-red-500' },
  purpose: { icon: Crosshair, color: 'text-gray-700' }, // Mapped to crucible
  value: { icon: Lightbulb, color: 'text-yellow-500' }, // Mapped to epiphany
  action: { icon: CheckCircle, color: 'text-blue-500' }, // Mapped to transformation
};

// Moved Node component outside MapEditor
const Node = ({ nodeData, onClick, nodePositions }: { nodeData: NodeData; onClick: () => void; nodePositions: { [key: string]: { top: string; left: string } } }) => {
  console.log('Rendering Node:', nodeData.node_type, nodeData.title);
  const position = nodePositions[nodeData.node_type] || { top: '50%', left: '50%' };
  const IconComponent = nodeIconMap[nodeData.node_type]?.icon;
  const iconColorClass = nodeIconMap[nodeData.node_type]?.color;

  return (
    <div
      id={`node-${nodeData.node_type}`}
      onClick={onClick}
      className="node absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center rounded-lg border border-slate-800 p-4 shadow-md cursor-pointer hover:scale-105 hover:shadow-xl bg-white/90 backdrop-blur-sm text-sm w-[180px] min-h-[110px]"
      style={position}
    >
      {IconComponent && (
        <div className="node-icon mb-1">
          <IconComponent className={`w-6 h-6 ${iconColorClass}`} />
        </div>
      )}
      <h3 className="node-title font-bold text-center text-2xl mb-1 font-shippori-mincho text-slate-800">{nodeData.title}</h3>
      <p className="text-sm text-slate-600 text-center line-clamp-3">{nodeData.details}</p>
    </div>
  );
};

export default function MapEditor({ initialMapData, readOnly }: { initialMapData: MapData; readOnly?: boolean }) {
  const [mapData, setMapData] = useState(initialMapData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const supabase = createClient(); // Initialize Supabase client

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (node: NodeData) => {
    if (readOnly) return; // Prevent opening modal in readOnly mode
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  const handleNodeUpdate = async (updatedNode: NodeData) => {
    // Update local state first
    const newNodes = mapData.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
    setMapData({ ...mapData, nodes: newNodes });

    // Save to database immediately
    const { error } = await supabase
      .from('nodes')
      .update({ title: updatedNode.title, details: updatedNode.details })
      .eq('id', updatedNode.id);

    if (error) {
      alert(`ノードの保存中にエラーが発生しました: ${error.message}`);
      console.error('Node save error:', error);
    } else {
      console.log('Node saved successfully:', updatedNode.id);
    }
    handleCloseModal();
  };

  // Removed handleSaveChanges function

  const drawLine = useCallback((svg: SVGSVGElement, fromNode: HTMLElement, toNode: HTMLElement) => {
    const containerRect = containerRef.current!.getBoundingClientRect();
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();

    const startX = fromRect.left - containerRect.left + fromRect.width / 2;
    const startY = fromRect.top - containerRect.top + fromRect.height / 2;
    const endX = toRect.left - containerRect.left + toRect.width / 2;
    const endY = toRect.top - containerRect.top + toRect.height / 2;

    const angle = Math.atan2(endY - startY, endX - startX);
    
    const getRadiusAtAngle = (rect: DOMRect, angle: number) => {
        const w = rect.width / 2; const h = rect.height / 2;
        const cos_a = Math.abs(Math.cos(angle)); const sin_a = Math.abs(Math.sin(angle));
        return (w * sin_a > h * cos_a) ? h / sin_a : w / cos_a;
    }

    const fromPadding = getRadiusAtAngle(fromRect, angle);
    const toPadding = getRadiusAtAngle(toRect, angle) + 5; // Add padding for arrowhead

    const adjustedStartX = startX + fromPadding * Math.cos(angle);
    const adjustedStartY = startY + fromPadding * Math.sin(angle);
    const adjustedEndX = endX - toPadding * Math.cos(angle);
    const adjustedEndY = endY - toPadding * Math.sin(angle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${adjustedStartX} ${adjustedStartY} L ${adjustedEndX} ${adjustedEndY}`);
    path.setAttribute('stroke', '#94a3b8');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('fill', 'none'); // Ensure fill is none
    svg.appendChild(path);
  }, []);

  const redrawLines = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || window.innerWidth < 768) return;

    // Clear existing lines but keep defs
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);

    for (const link of links) {
      const fromNode = document.getElementById(`node-${link.from}`);
      const toNode = document.getElementById(`node-${link.to}`);
      if (fromNode && toNode) {
        drawLine(svg, fromNode, toNode);
      }
    }
  }, [drawLine]);

  useEffect(() => {
    const handleResize = () => redrawLines();
    const timeoutId = setTimeout(redrawLines, 100); // Initial draw with delay
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [redrawLines, mapData]);

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-6 px-4 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold">{mapData.title}</h1>
        {/* Removed Save button */}
      </div>

      <div ref={containerRef} className="hidden md:block relative w-full max-w-4xl mx-auto" style={{ height: '1000px' }}>
        <svg ref={svgRef} width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-slate-400" />
            </marker>
          </defs>
        </svg>
        {/* Layer Labels */}
        <div className="absolute text-2xl font-bold text-gray-400 [writing-mode:vertical-rl] [text-orientation:mixed]" style={{ top: '10%', transform: 'translateY(-50%)', left: '1rem' }}>天</div>
        <div className="absolute text-2xl font-bold text-gray-400 [writing-mode:vertical-rl] [text-orientation:mixed]" style={{ top: '50%', transform: 'translateY(-50%)', left: '1rem' }}>空</div>
        <div className="absolute text-2xl font-bold text-gray-400 [writing-mode:vertical-rl] [text-orientation:mixed]" style={{ top: '90%', transform: 'translateY(-50%)', left: '1rem' }}>地</div>

        {mapData.nodes.map(node => {
          console.log('Mapping node in MapEditor:', node.node_type, node.title);
          return <Node key={node.id} nodeData={node} onClick={() => handleNodeClick(node)} nodePositions={nodePositions} />;
        })}
      </div>

      <div className="md:hidden space-y-4 px-4">
        {mapData.nodes.map(node => (
          <div key={node.id} onClick={() => handleNodeClick(node)} className="bg-white border border-slate-200 rounded-lg p-4 shadow">
             <h3 className="font-bold text-center text-lg mb-2">{node.title}</h3>
             <p className="text-sm text-slate-600">{node.details}</p>
          </div>
        ))}
      </div>

      <NodeEditModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleNodeUpdate}
        nodeData={selectedNode}
      />
    </div>
  );
}
