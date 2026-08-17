import { useState } from "react";
import { Nav } from "./sections/Nav.jsx";
import { Hero } from "./sections/Hero.jsx";
import { ServicesDirectory } from "./sections/ServicesDirectory.jsx";
import { BookingForm } from "./sections/BookingForm.jsx";
import { Footer } from "./sections/Footer.jsx";

export default function App() {
  const [formMode, setFormMode] = useState("appointment");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  function handleSelectForQuote(serviceId) {
    setFormMode("quotation");
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev : [...prev, serviceId]
    );
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Nav />
      <Hero />
      <ServicesDirectory
        selectedServiceIds={selectedServiceIds}
        onSelectForQuote={handleSelectForQuote}
      />
      <BookingForm
        mode={formMode}
        setMode={setFormMode}
        selectedServiceIds={selectedServiceIds}
        setSelectedServiceIds={setSelectedServiceIds}
      />
      <Footer />
    </>
  );
}
