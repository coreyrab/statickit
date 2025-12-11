'use client';

import {
  MapPin,
  Maximize2,
  MessageSquare,
  User,
  History,
  CameraOff,
} from 'lucide-react';

const features = [
  {
    title: 'Change locations',
    description: 'Same ad, new backdrop with perfect lighting and shadows everytime.',
    icon: MapPin,
    color: 'text-violet-400',
  },
  {
    title: 'New models',
    description: 'Test different people, ages, demographics. Reach new segments.',
    icon: User,
    color: 'text-blue-400',
  },
  {
    title: 'No reshoot needed',
    description: 'Skip the studio. Skip the photographer. Iterate from existing assets.',
    icon: CameraOff,
    color: 'text-emerald-400',
  },
  {
    title: 'Natural language edits',
    description: '"Make the lighting warmer" or "Make his shirt red". Edit in plain English.',
    icon: MessageSquare,
    color: 'text-pink-400',
  },
  {
    title: 'Version history',
    description: 'Every iteration saved. Navigate back and forth. Never lose a winner.',
    icon: History,
    color: 'text-orange-400',
  },
  {
    title: 'Resize with AI',
    description: '1:1, 9:16, 16:9, 4:5. Every format from a single image. One click.',
    icon: Maximize2,
    color: 'text-cyan-400',
  },
];

export function BentoGrid() {
  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wide mb-8">
          What you get
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${feature.color}`} />
                  <h3 className="text-white font-medium">{feature.title}</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
