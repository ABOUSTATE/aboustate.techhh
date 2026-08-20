import { Document, Page, View, Text, Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Funnel Display",
  fonts: [
    { src: "/assets/fonts/FunnelDisplay-Regular.ttf", fontWeight: 400 },
    { src: "/assets/fonts/FunnelDisplay-Medium.ttf", fontWeight: 500 },
    { src: "/assets/fonts/FunnelDisplay-SemiBold.ttf", fontWeight: 600 },
    { src: "/assets/fonts/FunnelDisplay-Bold.ttf", fontWeight: 700 },
    { src: "/assets/fonts/FunnelDisplay-ExtraBold.ttf", fontWeight: 800 },
  ],
});
Font.register({
  family: "DM Sans",
  fonts: [{ src: "/assets/fonts/DMSans-Variable.ttf", fontWeight: 400 }],
});

const COLORS = {
  green950: "#011f1a",
  green900: "#02362f",
  green700: "#1b4943",
  green500: "#4c706a",
  mint700: "#65826b",
  mint500: "#90b495",
  mint100: "#e5eae2",
  beige500: "#c3bcb3",
  beige300: "#dfdad4",
  beige100: "#f2efeb",
  white: "#faf8f5",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    fontSize: 10,
    color: COLORS.green950,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  wordmark: {
    fontFamily: "Funnel Display",
    fontWeight: 700,
    fontSize: 18,
    color: COLORS.white,
  },
  wordmarkDot: { color: COLORS.mint500 },
  headerRight: { alignItems: "flex-end" },
  quoteLabel: {
    fontFamily: "Funnel Display",
    fontWeight: 800,
    fontSize: 20,
    color: COLORS.mint500,
    letterSpacing: 1,
  },
  quoteNumber: { color: COLORS.beige300, fontSize: 9, marginTop: 2 },
  body: { paddingHorizontal: 40, paddingVertical: 28 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaBlock: { flexDirection: "column" },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLORS.mint700,
    marginBottom: 4,
  },
  metaValue: { fontSize: 11, color: COLORS.green950, marginBottom: 2 },
  table: { marginTop: 8, borderTop: `1px solid ${COLORS.beige500}` },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.beige100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${COLORS.beige300}`,
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  th: {
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.mint700,
    fontFamily: "Funnel Display",
    fontWeight: 600,
  },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalsLabel: { color: COLORS.green500 },
  totalsValue: { color: COLORS.green950 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${COLORS.beige500}`,
  },
  grandTotalLabel: { fontFamily: "Funnel Display", fontWeight: 700, fontSize: 12 },
  grandTotalValue: { fontFamily: "Funnel Display", fontWeight: 700, fontSize: 12 },
  notes: { marginTop: 32 },
  notesLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLORS.mint700,
    marginBottom: 6,
  },
  notesText: { color: COLORS.green500, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: `1px solid ${COLORS.beige300}`,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: COLORS.green500 },
});

function formatMoney(value, currency) {
  const n = Number(value) || 0;
  return `${currency === "USD" ? "$" : currency + " "}${n.toFixed(2)}`;
}

export function QuotePdfDocument({ quote }) {
  const {
    quoteNumber,
    clientName,
    clientEmail,
    lineItems,
    subtotal,
    discount,
    taxRate,
    total,
    currency,
    validUntil,
    notes,
  } = quote;

  const taxAmount = ((subtotal - discount) * (taxRate || 0)) / 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>
            aboustate<Text style={styles.wordmarkDot}>.</Text>tech
          </Text>
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>QUOTATION</Text>
            <Text style={styles.quoteNumber}>{quoteNumber}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Prepared for</Text>
              <Text style={styles.metaValue}>{clientName}</Text>
              <Text style={styles.metaValue}>{clientEmail}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Date issued</Text>
              <Text style={styles.metaValue}>
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              {Boolean(validUntil) && (
                <>
                  <Text style={[styles.metaLabel, { marginTop: 8 }]}>Valid until</Text>
                  <Text style={styles.metaValue}>
                    {new Date(validUntil).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colDescription]}>Description</Text>
              <Text style={[styles.th, styles.colQty]}>Qty</Text>
              <Text style={[styles.th, styles.colPrice]}>Unit price</Text>
              <Text style={[styles.th, styles.colAmount]}>Amount</Text>
            </View>
            {lineItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{formatMoney(item.unitPrice, currency)}</Text>
                <Text style={styles.colAmount}>
                  {formatMoney(item.quantity * item.unitPrice, currency)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatMoney(subtotal, currency)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>-{formatMoney(discount, currency)}</Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.totalsValue}>{formatMoney(taxAmount, currency)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatMoney(total, currency)}</Text>
            </View>
          </View>

          {Boolean(notes) && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>aboustate.tech — technical creative house</Text>
          <Text style={styles.footerText}>studio@aboustate.tech · +20 150 153 8408</Text>
        </View>
      </Page>
    </Document>
  );
}
