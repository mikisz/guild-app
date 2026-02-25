import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
    id: string;
    created_at: string;
    title: string;
    description: string;
    website_url: string;
    thumbnail_url: string | null;
    profiles: { display_name: string } | null;
    like_count?: number;
    has_liked?: boolean;
}

export function Feed({ refreshTrigger, sortBy = 'newest' }: { refreshTrigger: number, sortBy?: 'newest' | 'top_voted' | 'trending' }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, [refreshTrigger, user, sortBy]);

    const fetchProjects = async () => {
        setLoading(true);

        // Fetch projects with profile info
        const { data: projectsData, error } = await supabase
            .from('projects')
            .select(`
        *,
        profiles:user_id(display_name)
      `)
            .order('created_at', { ascending: false });

        if (error || !projectsData) {
            setLoading(false);
            return;
        }

        // Enhance with likes data
        const enhancedProjects = await Promise.all(
            projectsData.map(async (project) => {
                // Get total likes
                const { count } = await supabase
                    .from('likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', project.id);

                let has_liked = false;
                if (user) {
                    const { data: userLike } = await supabase
                        .from('likes')
                        .select('id')
                        .eq('project_id', project.id)
                        .eq('user_id', user.id)
                        .single();
                    if (userLike) has_liked = true;
                }

                return {
                    ...project,
                    profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles,
                    like_count: count || 0,
                    has_liked
                };
            })
        );

        // Sort projects based on selected option
        if (sortBy === 'top_voted') {
            enhancedProjects.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        } else if (sortBy === 'trending') {
            enhancedProjects.sort((a, b) => {
                const ageA = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
                const ageB = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60);
                const scoreA = (a.like_count || 0) / Math.pow(ageA + 2, 1.5);
                const scoreB = (b.like_count || 0) / Math.pow(ageB + 2, 1.5);
                return scoreB - scoreA;
            });
        }
        // 'newest' is already handled by the database query order('created_at', { ascending: false })

        setProjects(enhancedProjects);
        setLoading(false);
    };

    const toggleLike = async (projectId: string, currentStatus: boolean) => {
        if (!user) return;

        if (currentStatus) {
            // Unlike
            await supabase
                .from('likes')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', user.id);
        } else {
            // Like
            await supabase
                .from('likes')
                .insert([{ project_id: projectId, user_id: user.id }]);
        }

        // Optimistic update
        setProjects(projects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    has_liked: !currentStatus,
                    like_count: (p.like_count || 0) + (currentStatus ? -1 : 1)
                };
            }
            return p;
        }));
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2].map(i => (
                    <div key={i} className="animate-pulse bg-white rounded-3xl p-6 border border-gray-100 h-[400px]"></div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-gray-500 font-medium">No projects yet. Be the first to submit one!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {projects.map(project => (
                <div key={project.id} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] overflow-hidden">

                    {/* Header */}
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0062FF] to-blue-300 flex items-center justify-center text-white font-bold shadow-sm">
                                {project.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-[15px]">{project.profiles?.display_name || 'Unknown User'}</div>
                                <div className="text-xs text-gray-500 font-medium">{formatDistanceToNow(new Date(project.created_at))} ago</div>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* Media / Content */}
                    <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="block group px-5">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 isolate">
                            {project.thumbnail_url ? (
                                <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-lg hover:text-[#0062FF] transition-colors">
                                    Visit Website
                                </div>
                            )}
                            {/* Overlay for aesthetic */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6 z-10">
                                <p className="text-white font-medium text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    Link to {new URL(project.website_url).hostname}
                                </p>
                            </div>
                        </div>
                    </a>

                    {/* Description */}
                    <div className="px-6 pt-5 pb-3">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{project.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-[15px]">{project.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50/50">
                        <div className="flex gap-4">
                            <button
                                onClick={() => toggleLike(project.id, project.has_liked || false)}
                                className={`flex items-center gap-2 group px-3 py-1.5 -ml-3 rounded-lg transition-colors
                    ${project.has_liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <Heart
                                    size={22}
                                    className={`transition-all ${project.has_liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`}
                                />
                                <span className="font-semibold text-[15px]">{project.like_count || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 group px-3 py-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-[15px]">Reply</span>
                            </button>
                        </div>
                        <div>
                            <a
                                href={project.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-[#0062FF] hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors"
                            >
                                Visit
                            </a>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );
}
