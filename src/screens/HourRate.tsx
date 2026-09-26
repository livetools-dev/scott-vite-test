// The one screen, at "/": the machine hour rate. The manager picks a kind of
// machine, adjusts any figure, and the cost per spindle hour, the charge-out
// rate and the breakdown of the hour recalculate as they type.

import { useState } from "react";
import {
  Badge,
  Card,
  ChartKey,
  Form,
  FormGrid,
  Num,
  NumberField,
  Prose,
  RadioGroup,
  Readout,
  Row,
  Specs,
  Stack,
  Table,
  Tabs,
  chartColour,
} from "@livetools/ui";
import type { ChartSeriesNumber, RadioItem, TableColumn, TableRow } from "@livetools/ui";
import { MACHINE_TYPES, SHOP_DEFAULTS } from "../data/machineTypes";
import { BUSY_CUTTING_HOURS, FEW_CUTTING_HOURS, GST, dollars, hourRate, percent, whole, type HourRate as Rate, type HourRateInputs } from "../lib/hourRate";

type Figures = { [K in keyof HourRateInputs]: number | null };

const TYPE_ITEMS: readonly RadioItem[] = MACHINE_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
  hint: `${dollars(t.price, 0)} new, written off over ${t.years} years.`,
}));

/** Each cost keeps its colour however the lines are ordered. */
const SERIES: Readonly<Record<string, ChartSeriesNumber>> = {
  operator: 2,
  depreciation: 4,
  finance: 7,
  maintenance: 6,
  floor: 5,
  power: 1,
  overheads: 3,
};

const MACHINE_COSTS = ["depreciation", "finance", "maintenance", "floor", "power"];

const COST_COLUMNS: readonly TableColumn[] = [
  { id: "cost", label: "Cost", rowHeader: true },
  { id: "hour", label: "Per hour", kind: "number" },
  { id: "share", label: "Share", kind: "number" },
];
const FIRST_TYPE = MACHINE_TYPES[0];

const START: Figures = {
  price: FIRST_TYPE.price,
  resale: FIRST_TYPE.resale,
  years: FIRST_TYPE.years,
  maintenance: FIRST_TYPE.maintenance,
  floorArea: FIRST_TYPE.floorArea,
  powerDraw: FIRST_TYPE.powerDraw,
  ...SHOP_DEFAULTS,
};

/** Every figure filled in, or null while any is blank. */
function complete(f: Figures): HourRateInputs | null {
  for (const value of Object.values(f)) if (value === null || !Number.isFinite(value)) return null;
  return f as HourRateInputs;
}

export function HourRate() {
  const [machineType, setMachineType] = useState<string | null>(FIRST_TYPE.value);
  const [figures, setFigures] = useState<Figures>(START);

  const set = (key: keyof Figures) => (value: number | null) => setFigures((f) => ({ ...f, [key]: value }));

  function chooseType(value: string) {
    setMachineType(value);
    const t = MACHINE_TYPES.find((m) => m.value === value);
    if (t === undefined) return;
    setFigures((f) => ({
      ...f,
      price: t.price,
      resale: t.resale,
      years: t.years,
      maintenance: t.maintenance,
      floorArea: t.floorArea,
      powerDraw: t.powerDraw,
    }));
  }

  const inputs = complete(figures);
  const rate = inputs === null ? null : hourRate(inputs);
  const yearly = (keys: readonly string[]) =>
    rate === null ? null : rate.lines.filter((l) => keys.includes(l.key)).reduce((sum, l) => sum + l.perYear, 0);
  const machineYear = yearly(MACHINE_COSTS);
  const operatorYear = yearly(["operator"]);

  const machineFields = (
    <FormGrid>
      <NumberField
        label="Purchase price"
        name="price"
        hint="With delivery, rigging and installation."
        unit="AUD"
        decimals={0}
        min={0}
        step={1000}
        value={figures.price}
        onValueChange={set("price")}
      />
      <NumberField
        label="Resale value at the end"
        name="resale"
        unit="AUD"
        decimals={0}
        min={0}
        step={1000}
        value={figures.resale}
        onValueChange={set("resale")}
        validate={(v) =>
          v !== null && figures.price !== null && v > figures.price ? "Resale cannot be more than the purchase price." : null
        }
      />
      <NumberField
        label="Written off over"
        name="years"
        unit="years"
        decimals={0}
        min={1}
        max={30}
        stepper
        value={figures.years}
        onValueChange={set("years")}
      />
      <NumberField
        label="Interest rate"
        name="interestRate"
        hint="On the loan, or what the money would earn elsewhere."
        unit="% a year"
        decimals={1}
        min={0}
        max={30}
        step={0.25}
        value={figures.interestRate}
        onValueChange={set("interestRate")}
      />
      <NumberField
        label="Maintenance and repairs"
        name="maintenance"
        hint="Service contract, spares and breakdowns."
        unit="AUD a year"
        decimals={0}
        min={0}
        step={500}
        value={figures.maintenance}
        onValueChange={set("maintenance")}
      />
      <NumberField
        label="Floor space"
        name="floorArea"
        hint="With its chip bin and room to work round it."
        unit="m²"
        decimals={0}
        min={0}
        value={figures.floorArea}
        onValueChange={set("floorArea")}
      />
      <NumberField
        label="Rent"
        name="rent"
        unit="AUD per m² a year"
        decimals={0}
        min={0}
        step={5}
        value={figures.rent}
        onValueChange={set("rent")}
      />
      <NumberField
        label="Average power draw"
        name="powerDraw"
        hint="While cutting, not the nameplate rating."
        unit="kW"
        decimals={1}
        min={0}
        value={figures.powerDraw}
        onValueChange={set("powerDraw")}
      />
      <NumberField
        label="Electricity price"
        name="electricity"
        unit="c/kWh"
        decimals={1}
        min={0}
        value={figures.electricity}
        onValueChange={set("electricity")}
      />
    </FormGrid>
  );

  const operatorFields = (
    <FormGrid>
      <NumberField
        label="Hourly rate"
        name="wage"
        hint="Paid for all 52 weeks, leave included."
        unit="AUD/h"
        decimals={2}
        min={0}
        step={0.5}
        value={figures.wage}
        onValueChange={set("wage")}
      />
      <NumberField
        label="Superannuation"
        name="superRate"
        hint="The guarantee has been 12% since 1 July 2025."
        unit="%"
        decimals={1}
        min={0}
        max={30}
        value={figures.superRate}
        onValueChange={set("superRate")}
      />
      <NumberField
        label="Other on-costs"
        name="onCosts"
        hint="Payroll tax, workers' compensation, leave loading."
        unit="%"
        decimals={1}
        min={0}
        max={100}
        value={figures.onCosts}
        onValueChange={set("onCosts")}
      />
      <NumberField
        label="Machines one operator runs"
        name="machinesPerOperator"
        hint="The operator's cost is shared between them."
        unit="machines"
        decimals={0}
        min={1}
        max={10}
        stepper
        value={figures.machinesPerOperator}
        onValueChange={set("machinesPerOperator")}
      />
    </FormGrid>
  );

  const hoursFields = (
    <FormGrid>
      <NumberField
        label="Staffed hours a week"
        name="hoursPerWeek"
        hint="38 is one shift; two shifts is about 76."
        unit="h/week"
        decimals={0}
        min={1}
        max={168}
        stepper
        value={figures.hoursPerWeek}
        onValueChange={set("hoursPerWeek")}
      />
      <NumberField
        label="Weeks worked a year"
        name="weeksPerYear"
        hint="After the Christmas shutdown and public holidays."
        unit="weeks"
        decimals={0}
        min={1}
        max={52}
        stepper
        value={figures.weeksPerYear}
        onValueChange={set("weeksPerYear")}
      />
      <NumberField
        label="Utilisation"
        name="utilisation"
        hint="Share of staffed time the spindle is actually cutting."
        unit="%"
        decimals={0}
        min={1}
        max={100}
        warnBelow={50}
        warnMessage="Under half the time cutting: set-ups and waiting are eating the week."
        step={5}
        stepper
        value={figures.utilisation}
        onValueChange={set("utilisation")}
      />
      <NumberField
        label="Share of overheads"
        name="overheads"
        hint="Office, software, insurance and consumables for this machine."
        unit="AUD a year"
        decimals={0}
        min={0}
        step={1000}
        value={figures.overheads}
        onValueChange={set("overheads")}
      />
      <NumberField
        label="Margin"
        name="margin"
        unit="%"
        decimals={0}
        min={0}
        max={200}
        step={5}
        stepper
        value={figures.margin}
        onValueChange={set("margin")}
      />
    </FormGrid>
  );

  return (
    <Stack>
      <Prose>
        <h1>Machine hour rate</h1>
        <p>
          What one machine really costs you for every hour it cuts, and the rate to charge so it pays for itself. Pick
          a machine, change any figure to match your shop, and the answer works itself out as you type.
        </p>
      </Prose>

      <Form onSubmit={() => {}}>
        <Stack>
          <RadioGroup
            label="Kind of machine"
            name="machineType"
            hint="Picking one fills in its price, life, upkeep, floor space and power."
            layout="cards"
            items={TYPE_ITEMS}
            value={machineType}
            onValueChange={chooseType}
          />

          <div className="app-rate-layout">
            <Answer rate={rate} />
            <Tabs
              label="Your figures"
              items={[
                {
                  value: "machine",
                  code: "01",
                  label: "Machine",
                  meta: machineYear === null ? "Not complete" : `${dollars(machineYear, 0)} a year`,
                  attention: machineYear === null,
                  content: machineFields,
                },
                {
                  value: "operator",
                  code: "02",
                  label: "Operator",
                  meta: operatorYear === null ? "Not complete" : `${dollars(operatorYear, 0)} a year`,
                  attention: operatorYear === null,
                  content: operatorFields,
                },
                {
                  value: "hours",
                  code: "03",
                  label: "Hours",
                  meta: rate === null ? "Not complete" : `${whole(rate.cuttingHours)} h cutting`,
                  attention: rate === null,
                  content: hoursFields,
                },
              ]}
            />
          </div>
        </Stack>
      </Form>
    </Stack>
  );
}

/** How busy the machine is, as a badge on the answer card. */
function UseBadge({ hours }: { hours: number }) {
  if (hours < FEW_CUTTING_HOURS)
    return (
      <Badge variant="warning" icon="warning">
        Mostly idle
      </Badge>
    );
  if (hours >= BUSY_CUTTING_HOURS)
    return (
      <Badge variant="success" icon="success">
        Well used
      </Badge>
    );
  return (
    <Badge variant="neutral" icon="info">
      Steady use
    </Badge>
  );
}

/** One bar the width of the hour, split into its costs in their chart colours. */
function HourBar({ rate }: { rate: Rate }) {
  let x = 0;
  const words = rate.lines.map((l) => `${l.label} ${dollars(l.perHour)}`).join(", ");
  return (
    <svg className="app-hour-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label={`The hour split into its costs: ${words}.`}>
      {rate.lines.map((line) => {
        const width = rate.costPerHour > 0 ? (Math.max(line.perHour, 0) / rate.costPerHour) * 100 : 0;
        const rect = <rect key={line.key} x={x} y={0} width={width} height={10} fill={chartColour(SERIES[line.key] ?? "mark")} />;
        x += width;
        return rect;
      })}
    </svg>
  );
}

/** The answer: the two rates, the hour as a bar, what each cost adds, and the year in totals. */
function Answer({ rate }: { rate: Rate | null }) {
  if (rate === null) {
    return (
      <Card title="What an hour costs" titleAs="h2">
        <Readout label="Cost per spindle hour" value={null} unit="per hour" />
      </Card>
    );
  }

  const rows: readonly TableRow[] = rate.lines.map((line) => ({
    id: line.key,
    label: line.label,
    cells: {
      cost: (
        <span className="app-key-label">
          <ChartKey series={SERIES[line.key] ?? "mark"} />
          {line.label}
        </span>
      ),
      hour: <Num>{dollars(line.perHour)}</Num>,
      share: <Num>{percent(rate.costPerHour > 0 ? line.perHour / rate.costPerHour : 0)}</Num>,
    },
  }));

  const earned = rate.chargeOut * rate.cuttingHours;
  const costYear = rate.costPerHour * rate.cuttingHours;

  return (
    <Card title="What an hour costs" titleAs="h2" actions={<UseBadge hours={rate.cuttingHours} />}>
      <Stack>
        <Row>
          <Readout label="Cost per spindle hour" value={dollars(rate.costPerHour)} unit="per hour" formula="yearly costs ÷ cutting hours" />
          <Readout label="Charge-out rate, ex GST" value={dollars(rate.chargeOut)} unit="per hour" formula="cost × (1 + margin)" />
        </Row>
        <HourBar rate={rate} />
        <Table label="Where each hour's cost goes" columns={COST_COLUMNS} rows={rows} empty={{ title: "No costs yet" }} />
        <Specs
          bordered
          items={[
            { label: "Cutting hours a year", value: <Num>{whole(rate.cuttingHours)}</Num> },
            { label: "Charge-out rate, inc GST", value: <Num>{dollars(rate.chargeOut * (1 + GST))} per hour</Num> },
            { label: "Total cost a year", value: <Num>{dollars(costYear, 0)}</Num> },
            { label: "Margin it earns a year", value: <Num>{dollars(earned - costYear, 0)}</Num> },
          ]}
        />
      </Stack>
    </Card>
  );
}
