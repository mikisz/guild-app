import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageSquare, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
    id: string;
    created_at: string;
    type: 'like' | 'comment' | 'new_project';
    read: boolean;
    project_id: string;
    actor_id: string;
    actor: {
        display_name: string;
        email: string;
    };
    project: {
        title: string;
    };
};

export function NotificationsDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchNotifications(); // Re-fetch to get joined data (actor/project)
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!user) return;

        // We need to fetch notifications, and join profiles (for actor) and projects (for project title)
        const { data, error } = await supabase
            .from('notifications')
            .select(`
        id,
        created_at,
        type,
        read,
        project_id,
        actor_id,
        actor:profiles!notifications_actor_id_fkey(display_name, email),
        project:projects(title)
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching notifications:', error);
            return;
        }

        if (data) {
            // @ts-ignore
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter(n => !n.read).length);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        if (!error) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };

    const getNotificationContent = (notification: Notification) => {
        const actorName = notification.actor?.display_name || notification.actor?.email?.split('@')[0] || 'Someone';
        const projectTitle = notification.project?.title || 'a project';

        switch (notification.type) {
            case 'like':
                return (
                    <div className="flex gap-3">
                        <div className="mt-1 bg-red-100 p-1.5 rounded-full h-fit text-red-500">
                            <Heart size={16} className="fill-current" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{actorName}</span> liked your project <span className="font-semibold">{projectTitle}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                        </div>
                    </div>
                );
            case 'comment':
                return (
                    <div className="flex gap-3">
                        <div className="mt-1 bg-blue-100 p-1.5 rounded-full h-fit text-blue-500">
                            <MessageSquare size={16} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{actorName}</span> commented on your project <span className="font-semibold">{projectTitle}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                        </div>
                    </div>
                );
            case 'new_project':
                return (
                    <div className="flex gap-3">
                        <div className="mt-1 bg-emerald-100 p-1.5 rounded-full h-fit text-emerald-500">
                            <PlusCircle size={16} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{actorName}</span> posted a new project: <span className="font-semibold">{projectTitle}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`p-2.5 rounded-xl transition-colors relative ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                <Bell size={20} className={isOpen ? 'fill-current' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium bg-[#0062FF]/10 text-[#0062FF] px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                                <Bell size={32} className="mb-3 text-gray-200" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs mt-1 text-gray-400">When someone interacts with your projects, you'll see it here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-[#0062FF]/5' : ''}`}
                                    >
                                        {getNotificationContent(notification)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-50 bg-gray-50/50 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
