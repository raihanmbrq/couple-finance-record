import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ColorPreset } from '@/lib/types';

// ---------------------------------------------------------------------------
// Theme accent per active color preset
// ---------------------------------------------------------------------------
export const PRESET_ACCENT: Record<ColorPreset, string> = {
  emerald: '#047857',
  gold: '#B45309',
  rose: '#BE123C',
  slate: '#0369A1',
};

const INCOME_COLOR = '#16A34A';
const EXPENSE_COLOR = '#DC2626';
const HEADER_BG = '#F1F5F9';
const BORDER_COLOR = '#E2E8F0';
const TEXT_PRIMARY = '#0F172A';
const TEXT_MUTED = '#64748B';
const STRIPE_BG = '#F8FAFC';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportTxRow {
  id: string;
  date: string;
  type: 'income' | 'expense';
  typeLabel: string;
  category: string;
  wallet: string;
  spentBy: string;
  notes: string;
  amount: number;
}

export interface ReportCategoryRow {
  category: string;
  total: number;
  percentage: number;
}

export interface EStatementPDFDocumentProps {
  householdName: string;
  reportId: string;
  periodLabel: string;
  printedAtLabel: string;
  currency: string;
  accent: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  categoryBreakdown: ReportCategoryRow[];
  rows: ReportTxRow[];
  labels: Record<string, string>;
  formatAmount: (n: number) => string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 56,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: TEXT_PRIMARY,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  metaBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metaLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
  },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Section
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
    marginTop: 18,
    marginBottom: 8,
  },
  // Category breakdown
  catHeader: {
    flexDirection: 'row',
    backgroundColor: HEADER_BG,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  catHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  catName: {
    width: '30%',
    fontSize: 8,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
  },
  catBarWrap: {
    width: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  catPct: {
    width: 34,
    fontSize: 7.5,
    color: TEXT_MUTED,
    textAlign: 'right',
  },
  catAmount: {
    width: '22%',
    fontSize: 8,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    textAlign: 'right',
  },
  // Transaction table
  txHeader: {
    flexDirection: 'row',
    backgroundColor: HEADER_BG,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  txHeaderCell: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER_COLOR,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  txStriped: {
    backgroundColor: STRIPE_BG,
  },
  txCell: {
    fontSize: 7.5,
    color: TEXT_PRIMARY,
  },
  txAmountIncome: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: INCOME_COLOR,
    textAlign: 'right',
  },
  txAmountExpense: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: EXPENSE_COLOR,
    textAlign: 'right',
  },
  typeBadgeIncome: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#15803D',
  },
  typeBadgeExpense: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
  footerDisclaimer: {
    fontSize: 6.5,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 1.4,
  },
});

// Column widths for the 7-column transaction table (sums to 100%)
const COL = {
  date: '9%',
  type: '8%',
  category: '14%',
  wallet: '16%',
  spentBy: '15%',
  notes: '27%',
  amount: '11%',
} as const;

// ---------------------------------------------------------------------------
// Footer (static)
// ---------------------------------------------------------------------------

function Footer({ printedAtLabel, disclaimer }: { printedAtLabel: string; disclaimer: string }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>PairFlow</Text>
        <Text style={styles.footerText}>{printedAtLabel}</Text>
      </View>
      <Text style={styles.footerDisclaimer}>{disclaimer}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main document
// ---------------------------------------------------------------------------

export function EStatementPDFDocument({
  householdName,
  reportId,
  periodLabel,
  printedAtLabel,
  currency,
  accent,
  totalIncome,
  totalExpense,
  netCashflow,
  categoryBreakdown,
  rows,
  labels,
  formatAmount,
}: EStatementPDFDocumentProps) {
  return (
    <Document
      title={`PairFlow Report ${reportId}`}
      author="PairFlow"
      subject={`Financial Statement — ${householdName}`}
      creator="PairFlow"
      producer="PairFlow"
    >
      <Page size="A4" style={styles.page}>
        {/* ================= Header ================= */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBadge, { backgroundColor: accent }]}>
              <Text style={styles.logoText}>PF</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>PairFlow</Text>
              <Text style={styles.brandSub}>Financial E-Statement</Text>
            </View>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaValue}>{householdName}</Text>
            <Text style={styles.metaLabel}>
              {labels.reportId}: {reportId}
            </Text>
            <Text style={styles.metaLabel}>
              {labels.period}: {periodLabel}
            </Text>
            <Text style={styles.metaLabel}>
              {labels.formatCurrency}: {currency}
            </Text>
          </View>
        </View>

        {/* ================= Summary Cards ================= */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={styles.summaryLabel}>{labels.totalIncome}</Text>
            <Text style={[styles.summaryValue, { color: INCOME_COLOR }]}>{formatAmount(totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={styles.summaryLabel}>{labels.totalExpense}</Text>
            <Text style={[styles.summaryValue, { color: EXPENSE_COLOR }]}>{formatAmount(totalExpense)}</Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: '#F8FAFC',
                borderColor: accent,
                borderWidth: 1.5,
              },
            ]}
          >
            <Text style={styles.summaryLabel}>{labels.netCashflow}</Text>
            <Text style={[styles.summaryValue, { color: accent }]}>{formatAmount(netCashflow)}</Text>
          </View>
        </View>

        {/* ================= Category Breakdown ================= */}
        {categoryBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{labels.categoryBreakdown}</Text>
            <View style={styles.catHeader}>
              <Text style={[styles.catHeaderCell, { width: '30%' }]}>{labels.category}</Text>
              <Text style={[styles.catHeaderCell, { width: '38%' }]}>{labels.share}</Text>
              <Text style={[styles.catHeaderCell, { width: '22%', textAlign: 'right' }]}>{labels.amount}</Text>
            </View>
            {categoryBreakdown.map((row, i) => (
              <View
                key={`${row.category}-${i}`}
                style={[styles.catRow, ...(i % 2 === 1 ? [{ backgroundColor: STRIPE_BG }] : [])]}
              >
                <Text style={styles.catName}>{row.category}</Text>
                <View style={styles.catBarWrap}>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: `${row.percentage}%`, backgroundColor: accent }]} />
                  </View>
                  <Text style={styles.catPct}>{row.percentage.toLocaleString('id-ID')}%</Text>
                </View>
                <Text style={styles.catAmount}>{formatAmount(row.total)}</Text>
              </View>
            ))}
          </>
        )}

        {/* ================= Transaction Details ================= */}
        <Text style={styles.sectionTitle}>{labels.transactionDetails}</Text>
        <View style={styles.txHeader} fixed>
          <Text style={[styles.txHeaderCell, { width: COL.date }]}>{labels.date}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.type }]}>{labels.type}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.category }]}>{labels.category}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.wallet }]}>{labels.wallet}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.spentBy }]}>{labels.loggedBy}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.notes }]}>{labels.notes}</Text>
          <Text style={[styles.txHeaderCell, { width: COL.amount, textAlign: 'right' }]}>{labels.amount}</Text>
        </View>

        {rows.length === 0 ? (
          <View style={[styles.txRow, { justifyContent: 'center', paddingVertical: 16 }]}>
            <Text style={[styles.txCell, { color: TEXT_MUTED }]}>{labels.noTransactions}</Text>
          </View>
        ) : (
          rows.map((tx, i) => (
            <View key={tx.id} style={[styles.txRow, ...(i % 2 === 1 ? [styles.txStriped] : [])]}>
              <Text style={[styles.txCell, { width: COL.date }]}>{tx.date}</Text>
              <View style={{ width: COL.type }}>
                <Text style={tx.type === 'income' ? styles.typeBadgeIncome : styles.typeBadgeExpense}>
                  {tx.typeLabel}
                </Text>
              </View>
              <Text style={[styles.txCell, { width: COL.category }]}>{tx.category}</Text>
              <Text style={[styles.txCell, { width: COL.wallet }]}>{tx.wallet}</Text>
              <Text style={[styles.txCell, { width: COL.spentBy }]}>{tx.spentBy}</Text>
              <Text style={[styles.txCell, { width: COL.notes }]}>{tx.notes}</Text>
              <Text
                style={[
                  tx.type === 'income' ? styles.txAmountIncome : styles.txAmountExpense,
                  { width: COL.amount },
                ]}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatAmount(tx.amount)}
              </Text>
            </View>
          ))
        )}

        {/* ================= Footer ================= */}
        <Footer printedAtLabel={printedAtLabel} disclaimer={labels.disclaimer} />
      </Page>
    </Document>
  );
}
