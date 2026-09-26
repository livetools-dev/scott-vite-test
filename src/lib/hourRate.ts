// The machine hour rate: every cost of owning and running one machine for a
// year, divided by the hours it actually cuts. Money is in Australian dollars.

export type HourRateInputs = {
  price: number;
  resale: number;
  years: number;
  interestRate: number;
  maintenance: number;
  floorArea: number;
  rent: number;
  powerDraw: number;
  electricity: number;
  wage: number;
  superRate: number;
  onCosts: number;
  machinesPerOperator: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  utilisation: number;
  overheads: number;
  margin: number;
};

export type CostLine = { key: string; label: string; perYear: number; perHour: number };

export type HourRate = {
  cuttingHours: number;
  lines: readonly CostLine[];
  costPerHour: number;
  chargeOut: number;
  chargeOutWithGst: number;
};

/** Australian GST, 10%. */
export const GST = 0.1;

/** Paid weeks in a year: an operator is paid through leave and public holidays. */
const PAID_WEEKS = 52;

/** Below this many cutting hours a year the machine is mostly idle, and the rate shows it. */
export const FEW_CUTTING_HOURS = 1000;

export function hourRate(i: HourRateInputs): HourRate | null {
  const cuttingHours = i.hoursPerWeek * i.weeksPerYear * (i.utilisation / 100);
  if (!(cuttingHours > 0) || !(i.years > 0) || !(i.machinesPerOperator > 0)) return null;

  const perYear: readonly Omit<CostLine, "perHour">[] = [
    { key: "operator", label: "Operator, with super and on-costs", perYear: (i.wage * i.hoursPerWeek * PAID_WEEKS * (1 + (i.superRate + i.onCosts) / 100)) / i.machinesPerOperator },
    { key: "depreciation", label: "Depreciation", perYear: (i.price - i.resale) / i.years },
    { key: "finance", label: "Interest on the money in it", perYear: ((i.price + i.resale) / 2) * (i.interestRate / 100) },
    { key: "maintenance", label: "Maintenance and repairs", perYear: i.maintenance },
    { key: "floor", label: "Floor space", perYear: i.floorArea * i.rent },
    { key: "power", label: "Power", perYear: i.powerDraw * (i.electricity / 100) * cuttingHours },
    { key: "overheads", label: "Share of overheads", perYear: i.overheads },
  ];
  // Largest first, so the breakdown reads from what matters most.
  const lines = perYear.map((l) => ({ ...l, perHour: l.perYear / cuttingHours })).sort((a, b) => b.perHour - a.perHour);
  const costPerHour = lines.reduce((sum, l) => sum + l.perHour, 0);
  const chargeOut = costPerHour * (1 + i.margin / 100);
  return { cuttingHours, lines, costPerHour, chargeOut, chargeOutWithGst: chargeOut * (1 + GST) };
}

const DOLLARS = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const WHOLE = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

/** "$142.50" */
export function dollars(value: number): string {
  return DOLLARS.format(value);
}

/** "1,288" */
export function whole(value: number): string {
  return WHOLE.format(value);
}
