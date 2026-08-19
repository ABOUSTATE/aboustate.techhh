import { useState } from "react";
import { Nav } from "./sections/Nav.jsx";
import { Hero } from "./sections/Hero.jsx";
import { ServicesDirectory } from "./sections/ServicesDirectory.jsx";
import { BookingForm } from "./sections/BookingForm.jsx";
import { Footer } from "./sections/Footer.jsx";
import { QuoteJokeModal } from "./components/QuoteJokeModal.tsx";
import { getRandomQuoteJoke } from "./data/quoteJokes.js";

export default function App() {
  const [formMode, setFormMode] = useState("appointment");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [quoteJoke, setQuoteJoke] = useState(null);

  function handleSelectForQuote(serviceId) {
    setFormMode("quotation");
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev : [...prev, serviceId]
    );
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleGetQuoteClick() {
    setQuoteJoke(getRandomQuoteJoke());
  }

  function goToRealForm() {
    setQuoteJoke(null);
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Nav onGetQuoteClick={handleGetQuoteClick} />
      <Hero onGetQuoteClick={handleGetQuoteClick} />
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
      <QuoteJokeModal
        open={quoteJoke !== null}
        quote={quoteJoke || ""}
        onClose={() => setQuoteJoke(null)}
        onContinue={goToRealForm}
      />
    </>
  );
}
