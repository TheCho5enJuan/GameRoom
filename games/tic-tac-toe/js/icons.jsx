/* Ultimate Tic Tac Toe icon components */
// --- Custom SVG Icons (Replacing lucide-react for standalone use) ---
        const Icon = ({ d, children, size = 24, className = '', fill = 'none', ...props }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
                {d ? <path d={d} /> : children}
            </svg>
        );

        const Sun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
        const Moon = (p) => <Icon {...p} d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>;
        const Sparkles = (p) => <Icon {...p} d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>;
        const RotateCcw = (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></Icon>;
        const Trophy = (p) => <Icon {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></Icon>;
        const Volume2 = (p) => <Icon {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></Icon>;
        const VolumeX = (p) => <Icon {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></Icon>;
        const Users = (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
        const User = (p) => <Icon {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
        const Play = (p) => <Icon {...p}><polygon points="6 3 20 12 6 21 6 3"/></Icon>;
        const Bomb = (p) => <Icon {...p}><circle cx="11.5" cy="11.5" r="7.5"/><path d="m19.5 5.5-2.5 2.5"/><path d="m22 2-1.5 1.5"/><path d="m22 7-1.5-1.5"/><path d="m17 2 1.5 1.5"/></Icon>;
        const Zap = (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>;
        const CircleDashed = (p) => <Icon {...p}><path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M17.605 5.41a10 10 0 0 1 2.125 2.125"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M19.73 17.605a10 10 0 0 1-2.125 2.125"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M6.395 19.73a10 10 0 0 1-2.125-2.125"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M4.27 6.395a10 10 0 0 1 2.125-2.125"/></Icon>;
        const History = (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></Icon>;
        const FastForward = (p) => <Icon {...p}><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></Icon>;
        const Crosshair = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></Icon>;
        const RefreshCw = (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M21 12a9 9 0 1 0-9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></Icon>;
