'use client';

import { useState, useEffect, useMemo } from 'react';
import { StrategyScene } from '@prisma/client';
import { createScene, updateScene, deleteScene, updatePlaybook } from '@/app/actions/strategy';
import { ChevronRight, ChevronLeft, Plus, Save, Image as ImageIcon, Upload, ArrowUpLeft, Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SceneWithChildren = StrategyScene & { children: SceneWithChildren[] };

function buildSceneTree(scenes: StrategyScene[]): SceneWithChildren[] {
    const sceneMap = new Map<string, SceneWithChildren>();
    scenes.forEach(scene => sceneMap.set(scene.id, { ...scene, children: [] }));

    const rootScenes: SceneWithChildren[] = [];

    scenes.forEach(scene => {
        const sceneWithChildren = sceneMap.get(scene.id)!;
        if (scene.parentId) {
            const parent = sceneMap.get(scene.parentId);
            if (parent) {
                parent.children.push(sceneWithChildren);
            } else {
                rootScenes.push(sceneWithChildren);
            }
        } else {
            rootScenes.push(sceneWithChildren);
        }
    });

    return rootScenes;
}

interface SceneTreeItemProps {
    scene: SceneWithChildren;
    currentSceneId: string | null;
    onSelect: (id: string) => void;
}

const SceneTreeItem = ({ scene, currentSceneId, onSelect }: SceneTreeItemProps) => {
    const isSelected = scene.id === currentSceneId;
    const hasChildren = scene.children.length > 0;

    return (
        <div className="w-full">
             <button
                onClick={() => onSelect(scene.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm mb-0.5 flex items-center gap-2 transition-colors ${
                    isSelected ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                <span className="truncate">{scene.title}</span>
            </button>
            
            {hasChildren && (
                <div className="ml-2.5 pl-2.5 border-l border-slate-800 flex flex-col mt-0.5">
                    {scene.children.map(child => (
                        <SceneTreeItem 
                            key={child.id} 
                            scene={child} 
                            currentSceneId={currentSceneId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface PlaybookViewerProps {
    playbookId: string;
    initialScenes: StrategyScene[];
    playbookTitle: string;
    playbookDescription: string;
}

export function PlaybookViewer({ playbookId, initialScenes, playbookTitle, playbookDescription }: PlaybookViewerProps) {
    const router = useRouter();
    const [scenes, setScenes] = useState(initialScenes);
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(
        initialScenes.length > 0 ? initialScenes[0].id : null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Playbook Edit State
    const [isEditingPlaybook, setIsEditingPlaybook] = useState(false);
    const [playbookData, setPlaybookData] = useState({ title: playbookTitle, description: playbookDescription });

    const currentScene = scenes.find(s => s.id === currentSceneId);
    const children = scenes.filter(s => s.parentId === currentSceneId);
    const parent = currentScene?.parentId ? scenes.find(s => s.id === currentScene.parentId) : null;

    // Auto-select first scene if none selected and scenes exist
    useEffect(() => {
        if (!currentSceneId && scenes.length > 0) {
            const root = scenes.find(s => !s.parentId);
            if (root) setCurrentSceneId(root.id);
            else setCurrentSceneId(scenes[0].id);
        }
    }, [scenes, currentSceneId]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.select();
    };

    const handleCreateScene = async (parentId: string | null) => {
        const title = parentId ? `New Branch from ${currentScene?.title}` : 'New Scene';
        const result = await createScene({
            playbookId,
            title,
            parentId: parentId ?? undefined,
            description: 'Describe the play here...',
        });

        if (result.success && result.data) {
            setScenes([...scenes, result.data]);
            setCurrentSceneId(result.data.id);
            setIsEditing(true);
        }
    };

    const handleSaveScene = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentScene) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const result = await updateScene(currentScene.id, {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            imageUrl: formData.get('imageUrl') as string,
        });

        if (result.success && result.data) {
            setScenes(scenes.map(s => s.id === result.data!.id ? result.data! : s));
            setIsEditing(false);
        }
    };

    const handleDeleteScene = async () => {
        if (!currentScene) return;
        if (!confirm('Are you sure you want to delete this scene? All child scenes will also be deleted.')) return;

        const result = await deleteScene(currentScene.id);
        if (result.success) {
            const newScenes = scenes.filter(s => s.id !== currentScene.id);
            setScenes(newScenes);
            // Navigate to parent or root
            if (currentScene.parentId) {
                setCurrentSceneId(currentScene.parentId);
            } else if (newScenes.length > 0) {
                setCurrentSceneId(newScenes[0].id);
            } else {
                setCurrentSceneId(null);
            }
            setIsEditing(false);
        }
    };

    const handleUpdatePlaybook = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        const result = await updatePlaybook(playbookId, { title, description });
        if (result.success) {
            setPlaybookData({ title, description });
            setIsEditingPlaybook(false);
            router.refresh();
        }
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                if (currentScene) {
                    // Update local state
                    const updatedScene = { ...currentScene, imageUrl: data.url };
                    setScenes(prev => prev.map(s => s.id === currentScene.id ? updatedScene : s));

                    if (!isEditing) {
                        setIsEditing(true);
                    } else {
                        // If already editing, update the input manually as well
                        const input = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
                        if (input) {
                            input.value = data.url;
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleImageUpload(files[0]);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (!isEditing) return;
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) handleImageUpload(file);
            }
        }
    };

    const sceneTree = useMemo(() => buildSceneTree(scenes), [scenes]);

    if (!currentScene && scenes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="mb-4">No scenes yet.</p>
                <button
                    onClick={() => handleCreateScene(null)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                >
                    Create First Scene
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full gap-4" onPaste={handlePaste}>
            {/* Sidebar / Navigation Tree */}
            <div className="w-64 bg-slate-900 p-4 rounded-lg overflow-y-auto border border-slate-800 flex flex-col">
                <div className="mb-6 pb-4 border-b border-slate-800">
                    {isEditingPlaybook ? (
                        <form onSubmit={handleUpdatePlaybook} className="space-y-2">
                            <input 
                                name="title" 
                                defaultValue={playbookData.title} 
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                onFocus={handleFocus}
                            />
                            <textarea 
                                name="description" 
                                defaultValue={playbookData.description} 
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                                rows={2}
                                onFocus={handleFocus}
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-green-600 text-white text-xs py-1 rounded">Save</button>
                                <button type="button" onClick={() => setIsEditingPlaybook(false)} className="flex-1 bg-slate-700 text-white text-xs py-1 rounded">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="group relative">
                            <h2 className="font-bold text-white text-lg leading-tight mb-1 pr-6">{playbookData.title}</h2>
                            <p className="text-xs text-slate-500 line-clamp-2">{playbookData.description}</p>
                            <button 
                                onClick={() => setIsEditingPlaybook(true)}
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-slate-300 mb-4 text-xs uppercase tracking-wider">Scenes</h3>
                <div className="space-y-1 flex-1">
                    {sceneTree.map(scene => (
                        <SceneTreeItem 
                            key={scene.id} 
                            scene={scene} 
                            currentSceneId={currentSceneId}
                            onSelect={setCurrentSceneId}
                        />
                    ))}
                </div>
                <button
                    onClick={() => handleCreateScene(null)}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white border border-dashed border-slate-700 p-2 rounded"
                >
                    <Plus size={14} /> New Root Scene
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        {parent ? (
                            <button 
                                onClick={() => setCurrentSceneId(parent.id)} 
                                className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                                title={`Back to: ${parent.title}`}
                            >
                                <ArrowUpLeft size={16} />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                        ) : (
                            <div className="w-20"></div> // Spacer
                        )}
                        <h2 className="text-xl font-bold text-white">{currentScene?.title}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Scene'}
                        </button>
                        <button
                            onClick={() => handleCreateScene(currentSceneId)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Next Step
                        </button>
                    </div>
                </div>

                {/* Scene View */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isEditing ? (
                        <form onSubmit={handleSaveScene} className="space-y-6 max-w-3xl mx-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Title</label>
                                <input
                                    name="title"
                                    defaultValue={currentScene?.title}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                    onFocus={handleFocus}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tactical Board Image</label>
                                <div className="bg-slate-800 border border-slate-700 rounded p-4">
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            name="imageUrl"
                                            defaultValue={currentScene?.imageUrl || ''}
                                            placeholder="Image URL"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                            onFocus={handleFocus}
                                        />
                                    </div>
                                    
                                    <div 
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative ${
                                            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:bg-slate-700/30'
                                        }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
                                            {uploading ? (
                                                <span>Uploading...</span>
                                            ) : (
                                                <>
                                                    <Upload size={24} className={isDragging ? 'text-blue-500' : ''} />
                                                    <span className="text-sm font-medium">
                                                        {isDragging ? 'Drop image here' : 'Click to upload or drag & drop'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">You can also paste (Ctrl+V) an image anywhere on the screen</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Description / Notes</label>
                                <textarea
                                    name="description"
                                    defaultValue={currentScene?.description || ''}
                                    rows={6}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                    placeholder="Explain the movement, timing, or objective..."
                                    onFocus={handleFocus}
                                />
                            </div>

                            <div className="flex justify-between pt-4 border-t border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={handleDeleteScene}
                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={18} /> Delete Scene
                                </button>
                                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            {/* Image Display */}
                            <div className="mb-8 rounded-xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                                {currentScene?.imageUrl ? (
                                    <img src={currentScene.imageUrl} alt={currentScene.title} className="w-full h-auto max-h-[600px] object-contain" />
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
                                        <ImageIcon size={48} className="mb-2 opacity-50" />
                                        <p>No tactical image provided</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-800 mb-8">
                                <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Notes</h3>
                                <p className="text-lg text-slate-200 whitespace-pre-wrap leading-relaxed">
                                    {currentScene?.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Navigation / Children */}
                            {children.length > 0 && (
                                <div className="pt-4">
                                    <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <ChevronRight size={16} /> Next Steps / Variations
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {children.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => setCurrentSceneId(child.id)}
                                                className="group relative p-5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all text-left"
                                            >
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight className="text-blue-400" />
                                                </div>
                                                <h5 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                    {child.title}
                                                </h5>
                                                <p className="text-sm text-slate-400 line-clamp-2">
                                                    {child.description || 'No description'}
                                                </p>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleCreateScene(currentSceneId)}
                                            className="p-5 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 transition-all gap-2 group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                                                <Plus size={20} />
                                            </div>
                                            <span className="font-medium">Add New Variation</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
