import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Download, FileText } from "lucide-react";
import type { AnalyticsData } from "@/api/analyticsApi";

interface Props {
  data: AnalyticsData;
}

function escapeCSV(val: string | number | undefined | null): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const ExportSection: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const { stats, revenue, bookingAnalytics, cancellationStats, paymentAnalytics, customerMetrics, bookingTrends, monthlyRevenue, routePerformance, busUtilization, peakTimes, userRoles } = data;

  const generateCSV = (): string => {
    const lines: string[] = [];

    const section = (title: string) => lines.push(`\n"${title}"`);
    const row = (...vals: (string | number | undefined | null)[]) => lines.push(vals.map(escapeCSV).join(","));

    section("SUMMARY");
    row("Metric", "Value");
    row("Total Revenue", `CFA ${stats.totalRevenue}`);
    row("Total Bookings", stats.totalBookings);
    row("Total Users", stats.totalUsers);
    row("Active Buses", stats.activeBuses);
    row("Occupancy Rate", `${stats.occupancyRate.toFixed(1)}%`);
    row("Cancellation Rate", `${cancellationStats.cancellationRate}%`);
    row("Payment Success Rate", `${paymentAnalytics.successRate}%`);
    row("Total Customers", customerMetrics.totalCustomers);
    row("Repeat Customers", customerMetrics.repeatCustomers);

    section("REVENUE BY METHOD");
    row("Method", "Total", "Count");
    for (const r of revenue.revenueByMethod) {
      row(r._id, `CFA ${r.total}`, r.count);
    }

    section("BOOKING TRENDS (Last 30 Days)");
    row("Date", "Bookings", "Revenue");
    for (const b of bookingTrends) {
      row(b._id, b.count, `CFA ${b.revenue}`);
    }

    section("MONTHLY REVENUE");
    row("Month", "Revenue", "Transactions");
    for (const m of monthlyRevenue) {
      row(m._id, `CFA ${m.revenue}`, m.transactions);
    }

    section("ROUTE PERFORMANCE");
    row("Route", "Bookings", "Revenue");
    for (const r of routePerformance) {
      row(`${r.fromStationName} → ${r.toStationName}`, r.bookings, `CFA ${r.totalRevenue}`);
    }

    section("BUS UTILIZATION");
    row("Bus", "Trips", "Avg Occupancy", "Total Seats", "Booked");
    for (const b of busUtilization) {
      row(b.busNumber, b.totalTrips, `${b.avgOccupancy}%`, b.totalSeats, b.totalBooked);
    }

    section("CANCELLATION BY ROUTE");
    row("Route", "Total", "Cancelled", "Rate");
    for (const c of cancellationStats.byRoute) {
      row(`${c.fromStationName} → ${c.toStationName}`, c.total, c.cancelled, `${c.rate}%`);
    }

    section("PEAK DEPARTURE TIMES");
    row("Hour", "Trips", "Bookings");
    for (const p of peakTimes) {
      row(`${p._id}:00`, p.tripCount, p.totalBookings);
    }

    section("USERS BY ROLE");
    row("Role", "Count");
    for (const u of userRoles) {
      row(u._id, u.count);
    }

    section("BOOKINGS BY STATUS");
    row("Status", "Count");
    for (const [status, count] of Object.entries(bookingAnalytics.bookingsByStatus)) {
      row(status, count);
    }

    return lines.join("\n");
  };

  const handleExportCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const formatVal = (v: unknown) => v == null || v === "" ? "—" : String(v);

    const buildTable = (headers: string[], rows: string[][]) => `
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

    const summaryRows = [
      ["Total Revenue", `CFA ${stats.totalRevenue}`],
      ["Total Bookings", formatVal(stats.totalBookings)],
      ["Total Users", formatVal(stats.totalUsers)],
      ["Active Buses", formatVal(stats.activeBuses)],
      ["Occupancy Rate", `${stats.occupancyRate.toFixed(1)}%`],
      ["Cancellation Rate", `${cancellationStats.cancellationRate}%`],
      ["Payment Success", `${paymentAnalytics.successRate}%`],
      ["Total Customers", formatVal(customerMetrics.totalCustomers)],
      ["Repeat Customers", formatVal(customerMetrics.repeatCustomers)],
    ];

    const revRows = revenue.revenueByMethod.map(r => [r._id, `CFA ${r.total}`, formatVal(r.count)]);
    const routeRows = routePerformance.map(r => [`${r.fromStationName} → ${r.toStationName}`, formatVal(r.bookings), `CFA ${r.totalRevenue}`]);
    const busRows = busUtilization.map(b => [b.busNumber, formatVal(b.totalTrips), `${b.avgOccupancy}%`, formatVal(b.totalSeats), formatVal(b.totalBooked)]);
    const cancelRows = cancellationStats.byRoute.map(c => [`${c.fromStationName} → ${c.toStationName}`, formatVal(c.total), formatVal(c.cancelled), `${c.rate}%`]);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Analytics Export</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .date { color: #666; font-size: 13px; margin-bottom: 20px; }
        h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 2px solid #eee; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; padding: 6px 8px; border: 1px solid #ddd; font-weight: 600; }
        td { padding: 5px 8px; border: 1px solid #ddd; }
        tr:nth-child(even) td { background: #fafafa; }
        @media print { body { padding: 12px; } }
      </style></head><body>
      <h1>Analytics Report</h1>
      <div class="date">Generated: ${new Date().toLocaleString()}</div>

      <h2>Summary</h2>
      ${buildTable(["Metric", "Value"], summaryRows)}

      <h2>Revenue by Method</h2>
      ${buildTable(["Method", "Total", "Count"], revRows)}

      <h2>Route Performance</h2>
      ${buildTable(["Route", "Bookings", "Revenue"], routeRows)}

      <h2>Bus Utilization</h2>
      ${buildTable(["Bus", "Trips", "Avg Occupancy", "Seats", "Booked"], busRows)}

      <h2>Cancellation by Route</h2>
      ${buildTable(["Route", "Total", "Cancelled", "Rate"], cancelRows)}

      <h2>Users by Role</h2>
      ${buildTable(["Role", "Count"], userRoles.map(u => [u._id, formatVal(u.count)]))}

      <h2>Bookings by Status</h2>
      ${buildTable(["Status", "Count"], Object.entries(bookingAnalytics.bookingsByStatus).map(([k, v]) => [k, formatVal(v)]))}

      <script>window.onload=function(){window.print();window.close()}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
        <Download size={14} /> {t("common.exportCsv")}
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
        <FileText size={14} /> {t("common.exportPdf")}
      </Button>
    </div>
  );
};
