import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy } from 'lucide-react';

interface Profile {
    id: string;
    display_name: string;
    project_count: number;
}

export function Sidebar() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('profiles')
            .select('id, display_name, project_count')
            .order('project_count', { ascending: false })
            .order('display_name', { ascending: true })
            .limit(5)
            .then(({ data }) => {
                if (data) setUsers(data);
                setLoading(false);
            });
    }, []);

    return (
        <aside className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
                <Trophy size={18} className="text-yellow-500" />
                <h2 className="text-base font-bold text-gray-900">Top Creators</h2>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <ul className="space-y-4">
                    {users.map((u, index) => (
                        <li key={u.id} className="flex items-center justify-between group cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                                    {u.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-[#0062FF] transition-colors line-clamp-1">
                                        {u.display_name}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">Rank #{index + 1}</span>
                                </div>
                            </div>
                            <div className="flex justify-end font-bold text-right shrink-0">
                                <span className="text-gray-900 text-sm">
                                    {u.project_count}
                                </span>
                                <span className="text-gray-400 text-xs ml-1 mt-[2px]">pts</span>
                            </div>
                        </li>
                    ))}
                    {users.length === 0 && (
                        <li className="text-sm font-medium text-gray-500 text-center py-4">No creators yet.</li>
                    )}
                </ul>
            )}
        </aside>
    );
}
