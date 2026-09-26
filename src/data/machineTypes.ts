// Starting figures for the kinds of machine an Australian job shop runs, and
// the shop-wide figures the calculator opens with. Example data: plausible
// Australian dollar prices for new machines, not quotes. Every figure can be
// overwritten on screen.

export type MachineType = {
  value: string;
  label: string;
  /** Purchase price with installation, AUD. */
  price: number;
  /** What it should sell for at the end, AUD. */
  resale: number;
  /** Years it is written off over. */
  years: number;
  /** Service contract, spares and repairs, AUD a year. */
  maintenance: number;
  /** Floor it takes, with its chip bin and access, m². */
  floorArea: number;
  /** Average draw while cutting, kW. */
  powerDraw: number;
};

export const MACHINE_TYPES: readonly MachineType[] = [
  { value: "vmc3", label: "Three-axis vertical machining centre", price: 180000, resale: 40000, years: 8, maintenance: 6000, floorArea: 20, powerDraw: 9 },
  { value: "vmc5", label: "Five-axis machining centre", price: 650000, resale: 150000, years: 10, maintenance: 18000, floorArea: 30, powerDraw: 15 },
  { value: "lathe", label: "CNC lathe with live tooling", price: 320000, resale: 70000, years: 10, maintenance: 9000, floorArea: 18, powerDraw: 11 },
  { value: "slider", label: "Sliding-head lathe", price: 480000, resale: 110000, years: 10, maintenance: 14000, floorArea: 12, powerDraw: 8 },
  { value: "wire", label: "Wire EDM", price: 280000, resale: 50000, years: 10, maintenance: 12000, floorArea: 15, powerDraw: 6 },
];

/** The shop-wide figures, before anyone changes them. */
export const SHOP_DEFAULTS = {
  /** Interest on the money tied up in the machine, % a year. */
  interestRate: 7.5,
  /** Industrial rent, AUD per m² a year. */
  rent: 150,
  /** Business electricity, cents per kWh. */
  electricity: 32,
  /** Operator's base hourly rate, AUD. */
  wage: 38,
  /** Superannuation guarantee, % of ordinary time earnings (12% from 1 July 2025). */
  superRate: 12,
  /** Payroll tax, workers' compensation and leave loading, % of wages. */
  onCosts: 18,
  /** Machines one operator minds at once. */
  machinesPerOperator: 1,
  /** Hours the machine is staffed each week. */
  hoursPerWeek: 38,
  /** Weeks the shop works in a year, after the Christmas shutdown and public holidays. */
  weeksPerYear: 46,
  /** Share of staffed time the spindle is actually cutting, %. */
  utilisation: 70,
  /** This machine's share of the office, software, insurance and consumables, AUD a year. */
  overheads: 25000,
  /** Margin on top of cost, %. */
  margin: 20,
} as const;
