import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, PieChart, Info } from 'lucide-react';

const AuroraBackground = () => (
    <motion.div
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 z-0 dark:opacity-100 opacity-0 transition-opacity duration-500"
        style={{
            backgroundSize: '300% 300%',
            backgroundImage: 'linear-gradient(to right, #020617, #0f172a, #1e293b, #0f172a, #020617)',
        }}
    />
);

const AnimatedCounter = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, latest => Math.round(latest).toLocaleString());

    useEffect(() => {
        const controls = animate(count, value, {
            type: 'spring',
            stiffness: 100,
            damping: 20,
            mass: 1,
        });
        return controls.stop;
    }, [value]);

    return <motion.span>{rounded}</motion.span>;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const colorMap = { male: '#38bdf8', female: '#f472b6' };
        return (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
                <p className="label text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
                {payload.map((pld, index) => (
                    <div key={index} className="text-xs font-medium flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[pld.dataKey] }}></span>
                        <span className="text-slate-600 dark:text-slate-400">{pld.name}:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{pld.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const cardVariants = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 } },
    hover: { 
        scale: 1.03,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const springConfig = { stiffness: 100, damping: 15, mass: 0.1 };

const IndicatorCard = ({ indicator, onSelect }) => {
    const cardRef = useRef(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - (left + width / 2));
        mouseY.set(e.clientY - (top + height / 2));
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };
    
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-200, 200], ['-10deg', '10deg']);
    const rotateY = useTransform(springX, [-200, 200], ['10deg', '-10deg']);
    
    const glowX = useTransform(mouseX, [-200, 200], ['0%', '100%']);
    const glowY = useTransform(mouseY, [-200, 200], ['0%', '100%']);

    const formatTitle = (name) => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const barData = [
        { name: '0-14', male: indicator.male_0_14, female: indicator.female_0_14 },
        { name: '15+', male: indicator.male_over_14, female: indicator.female_over_14 },
    ];
    
    const hasDistributionData = barData.some(d => d.male > 0 || d.female > 0);

    return (
        <motion.div
            layout
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onSelect}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative h-full w-full"
        >
            <div 
                className="relative h-full w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50"
                style={{ transform: 'translateZ(16px)' }}
            >
                <AuroraBackground />
                
                <motion.div
                    className="absolute inset-0 z-10 pointer-events-none dark:opacity-100 opacity-0"
                    variants={{
                        initial: { opacity: 0 },
                        hover: { opacity: 1 },
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        background: useTransform(
                            [glowX, glowY],
                            ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(56, 189, 248, 0.15), transparent 40%)`
                        ),
                    }}
                />

                <div
                    className="relative z-20 flex flex-col justify-between h-full w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-medium text-lg text-slate-800 dark:text-slate-200">{formatTitle(indicator.name)}</h3>
                            <div className="p-1.5 bg-slate-200/70 dark:bg-slate-700/50 rounded-full">
                                <Activity className="text-sky-500 dark:text-sky-300" size={18} />
                            </div>
                        </div>
                        <p className="text-6xl font-bold tracking-tighter text-slate-900 dark:text-white">
                            <AnimatedCounter value={indicator.total} />
                        </p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Reported</p>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Age & Sex Distribution</h4>
                        <div className="h-[105px]">
                            {indicator.total > 0 && hasDistributionData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} barGap={8}>
                                        <defs>
                                            <linearGradient id="maleGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2} /></linearGradient>
                                            <linearGradient id="femaleGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f472b6" stopOpacity={0.8} /><stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} /></linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} className="stroke-slate-400 dark:stroke-slate-500" />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} 
                                            content={<CustomTooltip />}
                                        />
                                        <Bar dataKey="male" name="Male" fill="url(#maleGradient)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="female" name="Female" fill="url(#femaleGradient)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-700/50 rounded-full mb-2">
                                        {indicator.total === 0 ? <Info size={20} className="text-slate-400 dark:text-slate-300"/> : <PieChart size={20} className="text-slate-400 dark:text-slate-300"/>}
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {indicator.total === 0 ? "No cases reported" : "Distribution data unavailable"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default IndicatorCard;