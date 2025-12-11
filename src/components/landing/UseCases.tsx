'use client';

const useCases = [
  { title: 'Ad variations', description: 'Test more creative across every platform.' },
  { title: 'Thumbnail testing', description: 'A/B test YouTube thumbnails to find what gets clicks.' },
  { title: 'Carousel creation', description: 'Turn one hero image into a full carousel in seconds.' },
  { title: 'Image localization', description: 'Adapt your visuals for different markets and audiences.' },
  { title: 'Seasonal refresh', description: 'Update for holidays, weather, and seasonal campaigns.' },
  { title: 'Lighting & color fixes', description: 'Adjust mood and tone without re-editing source files.' },
  { title: 'Background swaps', description: 'New environments for the same product. No reshoots.' },
  { title: 'Quick edits', description: 'Remove objects, add elements, and fix details.' },
];

export function UseCases() {
  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wide mb-8">
          Use cases
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
          {useCases.map((useCase) => (
            <div key={useCase.title}>
              <h3 className="text-white font-medium mb-1">{useCase.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
