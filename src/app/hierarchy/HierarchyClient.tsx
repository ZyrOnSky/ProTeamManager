"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Handle,
  Position,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { ArrowLeft, Crown, Shield, User, Zap, Pencil, Check, X, Save } from 'lucide-react';
import Link from 'next/link';
import { updateUserHierarchyDetails } from './actions';

// --- Custom Node Components ---

const PersonNode = ({ data }: { data: any }) => {
  const isCaptain = data.isCaptain;
  const statusColor = data.status === 'ACTIVE' ? 'bg-green-500' : data.status === 'SUBSTITUTE' ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 min-w-[200px] bg-slate-900 ${isCaptain ? 'border-yellow-500 shadow-yellow-500/20' : 'border-slate-700'}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700`}>
            {data.role === 'ADMIN' ? <Shield size={20} className="text-red-500" /> :
             data.role === 'COACH' ? <Zap size={20} className="text-blue-500" /> :
             <User size={20} className="text-slate-400" />}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${statusColor}`} />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{data.name}</span>
            {isCaptain && <Crown size={14} className="text-yellow-500" />}
          </div>
          <div className="text-xs text-slate-400 font-medium uppercase">
            {data.jobTitle || data.role}
          </div>
        </div>
      </div>

      {data.position && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">POS</span>
          <span className="text-xs font-bold text-slate-300">{data.position}</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
};

const TeamNode = ({ data }: { data: any }) => {
  return (
    <div className="px-6 py-4 shadow-xl rounded-2xl border-2 border-blue-500/50 bg-blue-950/30 backdrop-blur-sm min-w-[250px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <h3 className="text-xl font-bold text-blue-400">{data.label}</h3>
      <div className="text-xs text-blue-300/70 mt-1 uppercase tracking-wider">Equipo / Alineación</div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
  team: TeamNode,
};

// --- Layout Logic ---

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 250;
  const nodeHeight = 100;

  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

// --- Main Component ---

interface HierarchyClientProps {
  initialData: {
    users: any[];
    lineups: any[];
  };
  currentUserRole: string;
}

export function HierarchyClient({ initialData, currentUserRole }: HierarchyClientProps) {
  const [orgName, setOrgName] = useState("Organización");
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editForm, setEditForm] = useState({ name: '', jobTitle: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("hierarchy_org_name");
    if (savedName) setOrgName(savedName);
  }, []);

  const handleSaveName = () => {
    localStorage.setItem("hierarchy_org_name", orgName);
    setIsEditingName(false);
  };

  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    if (node.type === 'person' && currentUserRole === 'ADMIN') {
      setSelectedNode(node);
      setEditForm({
        name: node.data.name,
        jobTitle: node.data.jobTitle
      });
    }
  }, [currentUserRole]);

  const handleSaveNodeOverride = async () => {
    if (!selectedNode) return;
    
    setIsSaving(true);
    const result = await updateUserHierarchyDetails(selectedNode.id, editForm.name, editForm.jobTitle);
    setIsSaving(false);

    if (result.success) {
      // Update local node state immediately
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                name: editForm.name,
                jobTitle: editForm.jobTitle
              }
            };
          }
          return node;
        })
      );
      setSelectedNode(null);
    } else {
      alert("Error al guardar los cambios. Inténtalo de nuevo.");
    }
  };

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 0. Create Organization Root Node
    nodes.push({
      id: 'org-root',
      type: 'team',
      data: { label: orgName }, // Use dynamic name
      position: { x: 0, y: 0 }
    });
    
    // 1. Create Admin Nodes (Top Level)
    const admins = initialData.users.filter(u => u.role === 'ADMIN');
    // General Staff: Role STAFF and NOT assigned to a lineup
    const generalStaff = initialData.users.filter(u => u.role === 'STAFF' && !u.assignedLineupId);
    
    // Add Admins and connect to Org Root
    admins.forEach(admin => {
      nodes.push({
        id: admin.id,
        type: 'person',
        data: { 
          name: admin.name, 
          originalName: admin.name,
          role: 'ADMIN', 
          jobTitle: admin.jobTitle || 'Administrador',
          originalJobTitle: admin.jobTitle || 'Administrador',
          status: admin.status 
        },
        position: { x: 0, y: 0 }
      });

      // Connect Org -> Admin
      edges.push({
        id: `e-org-${admin.id}`,
        source: 'org-root',
        target: admin.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ef4444', strokeWidth: 2 } // Red for Admin connections
      });
    });

    // Add General Staff (connected to Org Root, parallel to Admins but maybe visually distinct?)
    // Or connect to Admins? Let's connect to Org Root for now to keep them separate from Teams
    generalStaff.forEach(s => {
      nodes.push({
        id: s.id,
        type: 'person',
        data: { 
          name: s.name, 
          originalName: s.name,
          role: 'STAFF', 
          jobTitle: s.jobTitle || 'Staff General',
          originalJobTitle: s.jobTitle || 'Staff General',
          status: s.status 
        },
        position: { x: 0, y: 0 }
      });
      
      // Connect Org -> General Staff
      edges.push({
        id: `e-org-${s.id}`,
        source: 'org-root',
        target: s.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#64748b', strokeDasharray: '5,5' }
      });
    });

    // 2. Create Lineup Nodes (Teams)
    initialData.lineups.forEach(lineup => {
      nodes.push({
        id: `lineup-${lineup.id}`,
        type: 'team',
        data: { label: lineup.name },
        position: { x: 0, y: 0 }
      });

      // Connect All Admins -> Lineup
      admins.forEach(admin => {
        edges.push({
          id: `e-${admin.id}-lineup-${lineup.id}`,
          source: admin.id,
          target: `lineup-${lineup.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      });

      // 3. Add Members to Lineup
      const lineupMembers = initialData.users.filter(u => 
        u.assignedLineupId === lineup.id || 
        u.playerProfile?.lineupId === lineup.id
      );
      
      // Identify Roles within Lineup
      const managers = lineupMembers.filter(u => u.role === 'STAFF'); // Staff assigned to lineup = Manager
      const coaches = lineupMembers.filter(u => u.role === 'COACH');
      const players = lineupMembers.filter(u => u.role === 'PLAYER');

      // --- Managers ---
      managers.forEach(manager => {
        nodes.push({
          id: manager.id,
          type: 'person',
          data: { 
            name: manager.name, 
            originalName: manager.name,
            role: 'STAFF', 
            jobTitle: manager.jobTitle || 'Manager',
            originalJobTitle: manager.jobTitle || 'Manager',
            status: manager.status 
          },
          position: { x: 0, y: 0 }
        });
        
        // Lineup -> Manager
        edges.push({
          id: `e-lineup-${lineup.id}-${manager.id}`,
          source: `lineup-${lineup.id}`,
          target: manager.id,
          type: 'smoothstep',
          style: { stroke: '#10b981' }
        });
      });

      // --- Coaches ---
      // If Manager exists, connect Manager -> Coach. Else Lineup -> Coach.
      const coachParentId = managers.length > 0 ? managers[0].id : `lineup-${lineup.id}`;

      coaches.forEach(coach => {
        nodes.push({
          id: coach.id,
          type: 'person',
          data: { 
            name: coach.name, 
            originalName: coach.name,
            role: 'COACH', 
            jobTitle: coach.jobTitle || 'Coach',
            originalJobTitle: coach.jobTitle || 'Coach',
            status: coach.status 
          },
          position: { x: 0, y: 0 }
        });
        
        // Parent -> Coach
        edges.push({
          id: `e-${coachParentId}-${coach.id}`,
          source: coachParentId,
          target: coach.id,
          type: 'smoothstep',
          style: { stroke: '#3b82f6' }
        });
      });

      // --- Players ---
      // If Coach exists, connect Coach -> Player. Else Manager -> Player. Else Lineup -> Player.
      const playerParentId = coaches.length > 0 ? coaches[0].id : (managers.length > 0 ? managers[0].id : `lineup-${lineup.id}`);

      players.forEach(player => {
        nodes.push({
          id: player.id,
          type: 'person',
          data: { 
            name: player.name, 
            originalName: player.name,
            role: 'PLAYER', 
            jobTitle: player.jobTitle || 'Jugador',
            originalJobTitle: player.jobTitle || 'Jugador',
            position: player.playerProfile?.position,
            isCaptain: player.playerProfile?.isCaptain,
            status: player.status
          },
          position: { x: 0, y: 0 }
        });

        // Parent -> Player
        edges.push({
          id: `e-${playerParentId}-${player.id}`,
          source: playerParentId,
          target: player.id,
          type: 'smoothstep',
          style: { stroke: player.playerProfile?.isCaptain ? '#eab308' : '#475569' }
        });
      });
    });

    return getLayoutedElements(nodes, edges);
  }, [initialData]); // Removed orgName from dependency array to prevent full re-layout on name change

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state with props (server data updates)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Update nodes when orgName changes
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === 'org-root') {
          return { ...node, data: { ...node.data, label: orgName } };
        }
        return node;
      })
    );
  }, [orgName, setNodes]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Edit Node Modal */}
      {selectedNode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil size={18} className="text-blue-400" />
                Editar Integrante (Admin)
              </h3>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nombre (ID)
                </label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre del integrante"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Cargo / Rol
                </label>
                <input 
                  type="text" 
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej. Psicóloga Deportiva"
                />
              </div>

              <div className="pt-2">
                <div className="text-xs text-blue-400/80 bg-blue-500/10 p-2 rounded border border-blue-500/20 mb-4">
                  Nota: Estos cambios se guardarán en la base de datos y serán visibles para todos los usuarios.
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveNodeOverride}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    ) : (
                      <Save size={18} />
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Link href="/players" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Crown className="text-yellow-500" />
                Jerarquía Organizacional
              </h1>
              
              {/* Org Name Editor */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="bg-slate-900 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500 w-40"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-green-400 hover:text-green-300">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <span className="text-sm font-medium text-blue-400">{orgName}</span>
                    <Pencil size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-sm">Mapa interactivo de la estructura del equipo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-300">Activo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-300">Suplente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-300">Inactivo</span>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-slate-950 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="bg-slate-800 border-slate-700 text-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
