import { lazy, Suspense } from 'react';
import { canWebGL } from '../lib/hooks';
import { Boundary } from './ui';

const Hero = lazy(() => import('./Orb3D').then((m) => ({ default: m.HeroScene })));
const Orb = lazy(() => import('./Orb3D').then((m) => ({ default: m.InterviewerOrb })));

const Fallback = ({ mode = 'idle' }) => <div className={`orb-fallback ${mode}`} />;
const ok = canWebGL();

// WebGL na ho ya error aaye to CSS orb dikhega (app kabhi crash nahi hoga)
export const HeroOrb = () => (ok ? <Boundary fallback={<Fallback />}><Suspense fallback={<Fallback />}><Hero /></Suspense></Boundary> : <Fallback />);
export const AIOrb = ({ mode, compact }) => (ok ? <Boundary fallback={<Fallback mode={mode} />}><Suspense fallback={<Fallback mode={mode} />}><Orb mode={mode} compact={compact} /></Suspense></Boundary> : <Fallback mode={mode} />);
