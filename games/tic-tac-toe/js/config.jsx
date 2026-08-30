/* Ultimate Tic Tac Toe themes, rules, and helpers */
// --- Configuration & Constants ---
        const THEMES = {
            light: {
                bg: 'bg-slate-100', text: 'text-slate-800',
                card: 'bg-white shadow-xl border border-slate-200',
                cell: 'bg-slate-50 border-2 border-slate-200 transition-colors',
                drawText: 'text-slate-500',
                btn: 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300',
                activeBtn: 'bg-blue-600 text-white border border-blue-600 shadow-md',
                headerScore: 'bg-slate-50 border border-slate-200',
                input: 'bg-slate-50 border border-slate-300 focus:border-blue-500 text-slate-800',
            },
            dark: {
                bg: 'bg-slate-900', text: 'text-slate-100',
                card: 'bg-slate-800 shadow-2xl border border-slate-700',
                cell: 'bg-slate-800 border-2 border-slate-700 transition-colors',
                drawText: 'text-slate-400',
                btn: 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700',
                activeBtn: 'bg-blue-500 text-white border border-blue-500 shadow-lg shadow-blue-500/20',
                headerScore: 'bg-slate-900/50 border border-slate-700',
                input: 'bg-slate-900 border border-slate-600 focus:border-blue-400 text-white',
            },
            neon: {
                bg: 'bg-[#05050f]', text: 'text-cyan-300',
                card: 'bg-[#090915] shadow-[0_0_30px_rgba(34,211,238,0.1)] border border-cyan-500/30',
                cell: 'bg-[#05050f]/50 border border-cyan-500/30 transition-all',
                drawText: 'text-cyan-600 drop-shadow-[0_0_5px_rgba(8,145,178,0.8)]',
                btn: 'bg-transparent hover:bg-cyan-950/30 text-cyan-600 hover:text-cyan-300 border border-cyan-800 hover:border-cyan-400',
                activeBtn: 'bg-cyan-950 text-cyan-200 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]',
                headerScore: 'bg-black/40 border border-cyan-500/20',
                input: 'bg-black/50 border border-cyan-800 focus:border-cyan-400 text-cyan-100 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]',
            }
        };

        const PLAYER_COLORS = {
            light: [
                { text: 'text-blue-500', bg: 'bg-blue-500' },
                { text: 'text-rose-500', bg: 'bg-rose-500' },
                { text: 'text-emerald-500', bg: 'bg-emerald-500' },
                { text: 'text-amber-500', bg: 'bg-amber-500' },
                { text: 'text-violet-500', bg: 'bg-violet-500' },
                { text: 'text-cyan-500', bg: 'bg-cyan-500' },
                { text: 'text-slate-500', bg: 'bg-slate-500' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-rose-500', bg: 'bg-gradient-to-br from-blue-500 to-rose-500' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-emerald-500', bg: 'bg-gradient-to-br from-amber-500 to-emerald-500' }
            ],
            dark: [
                { text: 'text-blue-400', bg: 'bg-blue-400' },
                { text: 'text-rose-400', bg: 'bg-rose-400' },
                { text: 'text-emerald-400', bg: 'bg-emerald-400' },
                { text: 'text-amber-400', bg: 'bg-amber-400' },
                { text: 'text-violet-400', bg: 'bg-violet-400' },
                { text: 'text-cyan-400', bg: 'bg-cyan-400' },
                { text: 'text-slate-300', bg: 'bg-slate-300' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-400', bg: 'bg-gradient-to-br from-blue-400 to-rose-400' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400', bg: 'bg-gradient-to-br from-amber-400 to-emerald-400' }
            ],
            neon: [
                { text: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]', bg: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' },
                { text: 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]', bg: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]' },
                { text: 'text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]', bg: 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]' },
                { text: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]', bg: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' },
                { text: 'text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]', bg: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
                { text: 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]', bg: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' },
                { text: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]', bg: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]', bg: 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.5)]' },
                { text: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]', bg: 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' }
            ]
        };

        const HAZARD_DESCRIPTIONS = {
            bomb: "Destroys all adjacent pieces.",
            double: "Grants you an immediate extra turn.",
            blackhole: "Sucks a random opponent's piece into the void.",
            wipe: "Destroys the entire row and column.",
            steal: "Converts a random opponent's piece into yours."
        };

        // Dynamic Win Checker
        const checkWinDynamic = (board, size) => {
            const target = size; 
            const getCell = (r, c) => board[r * size + c];

            for (let r = 0; r < size; r++) {
                for (let c = 0; c <= size - target; c++) {
                    let val = getCell(r, c);
                    if (val && Array.from({ length: target }).every((_, i) => getCell(r, c + i) === val)) {
                        return { winner: val, line: Array.from({ length: target }).map((_, i) => r * size + c + i) };
                    }
                }
            }

            for (let c = 0; c < size; c++) {
                for (let r = 0; r <= size - target; r++) {
                    let val = getCell(r, c);
                    if (val && Array.from({ length: target }).every((_, i) => getCell(r + i, c) === val)) {
                        return { winner: val, line: Array.from({ length: target }).map((_, i) => (r + i) * size + c) };
                    }
                }
            }

            for (let r = 0; r <= size - target; r++) {
                for (let c = 0; c <= size - target; c++) {
                    let val1 = getCell(r, c);
                    if (val1 && Array.from({ length: target }).every((_, i) => getCell(r + i, c + i) === val1)) {
                        return { winner: val1, line: Array.from({ length: target }).map((_, i) => (r + i) * size + c + i) };
                    }
                    let val2 = getCell(r, c + target - 1);
                    if (val2 && Array.from({ length: target }).every((_, i) => getCell(r + i, c + target - 1 - i) === val2)) {
                        return { winner: val2, line: Array.from({ length: target }).map((_, i) => (r + i) * size + c + target - 1 - i) };
                    }
                }
            }
            return null;
        };
