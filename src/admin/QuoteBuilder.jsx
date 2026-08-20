import { useMemo, useState } from "react";

function emptyLineItem() {
  return { description: "", quantity: 1, unitPrice: 0 };
}

export function QuoteBuilder({ order, onClose }) {
  const [clientName, setClientName] = useState(order?.Name || "");
  const [clientEmail, setClientEmail] = useState(order?.Email || "");
  const [lineItems, setLineItems] = useState(() => {
    const services = (order?.Services || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return services.length
      ? services.map((s) => ({ description: s, quantity: 1, unitPrice: 0 }))
      : [emptyLineItem()];
  });
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState(
    "Prices valid for the period stated above. 50% deposit due to begin work; balance due on delivery."
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedQuote, setSavedQuote] = useState(null);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0),
    [lineItems]
  );
  const taxAmount = useMemo(() => ((subtotal - discount) * (taxRate || 0)) / 100, [subtotal, discount, taxRate]);
  const total = useMemo(() => Math.max(0, subtotal - discount + taxAmount), [subtotal, discount, taxAmount]);

  function updateItem(index, patch) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeItem(index) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const quotePayload = {
      serviceRequestId: order?.ID || null,
      clientName,
      clientEmail,
      lineItems,
      subtotal,
      discount: Number(discount) || 0,
      taxRate: Number(taxRate) || 0,
      total,
      currency,
      validUntil: validUntil || null,
      notes,
    };

    try {
      const response = await fetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotePayload),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const quote = {
        quoteNumber: data.quotation.quote_number,
        clientName,
        clientEmail,
        lineItems,
        subtotal,
        discount: Number(discount) || 0,
        taxRate: Number(taxRate) || 0,
        total,
        currency,
        validUntil: validUntil || null,
        notes,
      };

      // Loaded on demand — @react-pdf/renderer is large and only needed
      // once an admin actually generates a quote, not on every dashboard
      // load.
      const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./QuotePdfDocument.jsx"),
      ]);

      const blob = await pdf(<QuotePdfDocument quote={quote} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quote.quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSavedQuote(data.quotation);
    } catch {
      setError("Couldn't generate the quote. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (savedQuote) {
    return (
      <div className="mb-6 rounded-md border border-border-subtle bg-surface-card p-6 text-center">
        <h3 className="mb-2 font-display text-h3 font-bold text-text-primary">
          {savedQuote.quote_number} generated
        </h3>
        <p className="mb-4 font-body text-small text-text-secondary">
          The PDF downloaded and the quote is saved on record.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm bg-accent px-6 py-2.5 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="mb-6 rounded-md border border-border-subtle bg-surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-h3 font-bold text-text-primary">Build quotation</h3>
        <button
          type="button"
          onClick={onClose}
          className="font-body text-small text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
            Client name
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
            Client email
          </label>
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      <label className="mb-2 block font-body text-small font-semibold text-text-primary">Line items</label>
      <div className="mb-3 flex flex-col gap-2">
        {lineItems.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              required
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              className="min-w-[180px] flex-1 rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={item.quantity}
              onChange={(e) => updateItem(i, { quantity: e.target.value })}
              className="w-20 rounded-sm border border-border-subtle bg-surface-page px-2 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
              title="Quantity"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
              className="w-28 rounded-sm border border-border-subtle bg-surface-page px-2 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
              title="Unit price"
            />
            <span className="w-24 text-right font-body text-small text-text-secondary">
              {(Number(item.quantity) * Number(item.unitPrice) || 0).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={lineItems.length === 1}
              className="rounded-sm border border-mint-700 px-2 py-1 font-body text-small text-mint-700 transition-colors duration-150 hover:bg-mint-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mb-5 rounded-sm border border-border-subtle px-3 py-1.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
      >
        + Add line item
      </button>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Discount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Tax %</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="EGP">EGP</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
            Valid until
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Notes / terms</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="mb-5 flex justify-end">
        <div className="w-56 text-right">
          <div className="mb-1 flex justify-between font-body text-small text-text-secondary">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="mb-1 flex justify-between font-body text-small text-text-secondary">
              <span>Discount</span>
              <span>-{Number(discount).toFixed(2)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="mb-1 flex justify-between font-body text-small text-text-secondary">
              <span>Tax ({taxRate}%)</span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border-subtle pt-2 font-display text-h3 font-bold text-text-primary">
            <span>Total</span>
            <span>
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Generating…" : "Save & download PDF"}
      </button>
    </form>
  );
}
