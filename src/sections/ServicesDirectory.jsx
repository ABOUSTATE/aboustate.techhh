import { useMemo, useState } from "react";
import { CATEGORIES, SERVICES } from "../data/services.js";
import { CategoryChips } from "../components/CategoryChips.jsx";
import { ServiceCard } from "../components/ServiceCard.jsx";

export function ServicesDirectory({ selectedServiceIds, onSelectForQuote }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredServices = useMemo(() => {
    if (activeCategory === "All") return SERVICES;
    return SERVICES.filter((service) => service.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="services" className="bg-surface-page px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-container">
        <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-accent">
          Capabilities
        </div>
        <h2 className="mb-8 max-w-[24ch] font-display text-h1 font-bold tracking-tight text-text-primary">
          A full-service directory, filterable by discipline.
        </h2>

        <CategoryChips
          categories={CATEGORIES}
          active={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedServiceIds.includes(service.id)}
              onSelectForQuote={onSelectForQuote}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
