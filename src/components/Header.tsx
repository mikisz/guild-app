import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, Search, Bell, Hexagon } from 'lucide-react';

export function Header({ onSubmitProject }: { onSubmitProject: () => void }) {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<{ display_name: string } | null>(null);

    useEffect(() => {
        if (user) {
            supabase
                .from('profiles')
                .select('display_name')
                .eq('id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setProfile(data);
                });
        }
    }, [user]);

    return (
        <header className="bg-white sticky top-0 z-10 border-b border-gray-100/80">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">

                {/* Left: Brand */}
                <div className="flex items-center gap-3 w-64 shrink-0 mt-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#0062FF] flex items-center justify-center shadow-sm">
                        <Hexagon size={18} className="text-white fill-current" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Project Wall</h1>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-2xl px-4 lg:px-12 hidden md:block">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0062FF] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search projects or creators..."
                            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FA] border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#0062FF] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#0062FF]/10 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Right: Actions & User */}
                <div className="flex items-center gap-4 shrink-0 justify-end">
                    <button
                        onClick={onSubmitProject}
                        className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#0062FF] hover:bg-[#0051D5] text-white text-sm font-semibold rounded-xl shadow-sm shadow-[#0062FF]/20 transition-all hover:shadow-md hover:shadow-[#0062FF]/30 active:scale-95"
                    >
                        <Plus size={18} />
                        Submit project
                    </button>

                    <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>

                    <div className="flex items-center gap-3 cursor-pointer group px-2 py-1 hover:bg-gray-50 rounded-xl transition-colors" onClick={signOut} title="Sign out">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0062FF] to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white overflow-hidden shrink-0">
                            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block leading-tight">
                            <div className="text-sm font-bold text-gray-900 group-hover:text-[#0062FF] transition-colors">{profile?.display_name || 'User'}</div>
                            <div className="text-xs text-gray-500 font-medium truncate w-32">{user?.email}</div>
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}
