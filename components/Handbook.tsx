
import * as React from 'react';
import { useTranslation } from '../lib/i18n';

interface HandbookProps {
    onClose: () => void;
}

export const Handbook: React.FC<HandbookProps> = ({ onClose }) => {
    const { t } = useTranslation();

    // Effect to handle the 'Escape' key for closing the modal, improving accessibility.
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup the event listener when the component unmounts.
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-0 md:p-8 overflow-hidden backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl h-full md:h-[90vh] bg-parchment text-slate-900 border-8 border-slate-900/10 rounded-sm shadow-2xl overflow-hidden flex flex-col animate-[fade-in_0.3s_ease-out] font-typewriter"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manila Folder Texture Overlay */}
                <div className="absolute inset-0 z-0 bg-manila opacity-40 pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] z-0 coffee-stain opacity-20 w-[300px] h-[300px] rotate-[15deg] pointer-events-none" style={{ mixBlendMode: 'multiply' }} />

                {/* Header */}
                <div className="relative p-8 md:p-12 border-b-4 border-slate-900/10 flex-shrink-0 z-10 bg-slate-900/5">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 rounded-sm border-2 border-slate-900/20 transition-all z-20 group"
                        aria-label="Close Handbook"
                    >
                        <span className="text-xl group-hover:scale-110 font-bold">✕</span>
                    </button>

                    <div className="text-left">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-slate-900 mb-2">{t('handbook.title')}</h1>
                        <p className="text-slate-500 text-sm md:text-base uppercase tracking-[0.2em] font-bold">{t('handbook.version')}</p>
                    </div>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10 space-y-12 relative z-10">

                    {/* Mission Protocol */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                            <span className="text-ink">01</span> {t('handbook.section1_title')}
                            <div className="flex-1 h-1 bg-slate-900/10" />
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/40 border-4 border-slate-900/5 p-6 rounded-sm shadow-inner">
                                <h3 className="text-ink font-black mb-3 uppercase tracking-wider">{t('handbook.phase1_title')}</h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {t('handbook.phase1_desc')}
                                </p>
                            </div>
                            <div className="bg-white/40 border-4 border-slate-900/5 p-6 rounded-sm shadow-inner">
                                <h3 className="text-ink font-black mb-3 uppercase tracking-wider">{t('handbook.phase2_title')}</h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {t('handbook.phase2_desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Specialists */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                            <span className="text-ink">02</span> {t('handbook.section2_title')}
                            <div className="flex-1 h-1 bg-slate-900/10" />
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { id: 'thief', tag: 'Versatile' },
                                { id: 'locksmith', tag: 'Technical' },
                                { id: 'wirehead', tag: 'Electronics' },
                                { id: 'ghost', tag: 'Infiltrator' },
                                { id: 'cracker', tag: 'Safecracker' },
                                { id: 'master_blaster', tag: 'Demolition' }
                            ].map((spec) => (
                                <div key={spec.id} className="group bg-white/40 border-4 border-slate-900/5 p-5 rounded-sm shadow-inner transition-all hover:border-ink/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-slate-900 font-black uppercase text-lg">{t(`handbook.specialists.${spec.id}.name`)}</h3>
                                        <span className="text-[9px] bg-ink/10 text-ink px-2 py-0.5 rounded-sm font-black uppercase border border-ink/20">{t(`handbook.specialists.${spec.id}.tag`)}</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-2 font-medium">
                                        <li className="flex gap-2"><span>→</span> {t(`handbook.specialists.${spec.id}.perk1`)}</li>
                                        {spec.id !== 'master_blaster' && (
                                            <li className="flex gap-2"><span>→</span> <b>{t(`handbook.specialists.${spec.id}.perk2`).split(':')[0]}:</b>{t(`handbook.specialists.${spec.id}.perk2`).split(':')[1]}</li>
                                        )}
                                        {spec.id === 'master_blaster' && (
                                            <li className="flex gap-2"><span>→</span> {t(`handbook.specialists.${spec.id}.perk2`)}</li>
                                        )}
                                        {t(`handbook.specialists.${spec.id}.perk3`) !== `handbook.specialists.${spec.id}.perk3` && (
                                            <li className="flex gap-2"><span>→</span> {t(`handbook.specialists.${spec.id}.perk3`)}</li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Stealth & Detection */}
                    <section className="space-y-6 relative">
                        <div className="absolute top-0 right-0 z-0 coffee-stain opacity-10 w-[200px] h-[200px] rotate-[-10deg] pointer-events-none" />
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                            <span className="text-ink">03</span> {t('handbook.section3_title')}
                            <div className="flex-1 h-1 bg-slate-900/10" />
                        </h2>
                        <div className="bg-white/50 border-ink border-l-8 p-8 rounded-sm shadow-inner">
                            <h4 className="text-ink text-xs font-black uppercase tracking-widest mb-3 italic">{t('handbook.stealth_intel_label')}</h4>
                            <p className="text-lg text-slate-800 font-medium mb-4 leading-snug">
                                {t('handbook.stealth_intel_desc')}
                            </p>
                            <div className="bg-slate-900/5 p-4 rounded-sm border-2 border-dashed border-slate-900/10">
                                <p className="text-sm text-slate-500 font-handwriting italic text-xl">
                                    "{t('handbook.stealth_pro_tip')}"
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Gear */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                            <span className="text-ink">04</span> {t('handbook.section4_title')}
                            <div className="flex-1 h-1 bg-slate-900/10" />
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: '🔑', id: 'skeletonKey' },
                                { icon: '📹', id: 'cameraLooper' },
                                { icon: '✂️', id: 'glassCutter' },
                                { icon: '🔥', id: 'thermicLance' },
                                { icon: '🧼', id: 'foamCanister' },
                                { icon: '💨', id: 'stunOMat' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-sm border-4 border-slate-900/5 shadow-sm">
                                    <span className="text-3xl filter grayscale contrast-125 opacity-70">{item.icon}</span>
                                    <div>
                                        <h4 className="text-slate-900 text-sm font-black uppercase tracking-tight">{t(`item.${item.id}.name`)}</h4>
                                        <p className="text-slate-600 text-[11px] font-medium leading-tight">{t(`item.${item.id}.desc`)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="pt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        {t('handbook.copyright')}
                    </div>
                </div>
            </div>
        </div>
    );
};
