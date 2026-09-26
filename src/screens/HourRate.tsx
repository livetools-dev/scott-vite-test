// The one screen, at "/": the machine hour rate. The manager picks a kind of
// machine, adjusts any figure, and the cost per spindle hour, the charge-out
// rate and the breakdown of the hour recalculate as they type.

import { useState } from "react";
import {
  Fieldset,
  Form,
  FormGrid,
  Measure,
  MeasureSet,
  NumberField,
  Prose,
  Readout,
  Row,
  Select,
  Stack,
} from "@livetools/ui";
import type { SelectItem } from "@livetools/ui";
import { MACHINE_TYPES, SHOP_DEFAULTS } from "../data/machineTypes";
import { FEW_CUTTING_HOURS, dollars, hourRate, whole, type HourRateInputs } from "../lib/hourRate";

type Figures = { [K in keyof HourRateInputs]: number | null };

const TYPE_ITEMS: readonly SelectItem[] = MACHINE_TYPES.map((t) => ({ value: t.value, label: t.label }));
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

  function chooseType(value: string | null) {
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
  const largest = rate === null ? 0 : Math.max(...rate.lines.map((l) => l.perHour));
  const fewHours = rate !== null && rate.cuttingHours < FEW_CUTTING_HOURS;

  return (
    <Stack>
      <Prose>
        <h1>Machine hour rate</h1>
        <p>
          What one machine really costs you for every hour it cuts, and the rate to charge so it pays for itself. Pick
          the kind of machine, change any figure to match your shop, and everything below works itself out as you type.
        </p>
      </Prose>

      <Row>
        <Readout
          label="Cutting hours a year"
          value={rate === null ? null : whole(rate.cuttingHours)}
          unit="hours"
          formula="hours a week × weeks × utilisation"
        />
        {fewHours ? (
          <Readout
            label="Cost per spindle hour"
            value={dollars(rate.costPerHour)}
            unit="per hour"
            formula="yearly costs ÷ cutting hours"
            status="warning"
            problem="Under 1,000 cutting hours a year: the machine sits idle most of the time, so every hour carries a lot of cost."
          />
        ) : (
          <Readout
            label="Cost per spindle hour"
            value={rate === null ? null : dollars(rate.costPerHour)}
            unit="per hour"
            formula="yearly costs ÷ cutting hours"
          />
        )}
        <Readout
          label="Charge-out rate, ex GST"
          value={rate === null ? null : dollars(rate.chargeOut)}
          unit="per hour"
          formula="cost × (1 + margin)"
        />
        <Readout
          label="Charge-out rate, inc GST"
          value={rate === null ? null : dollars(rate.chargeOutWithGst)}
          unit="per hour"
          formula="ex GST × 1.1"
        />
      </Row>

      <Form onSubmit={() => {}}>
        <Stack>
          <Fieldset legend="The machine">
            <FormGrid>
              <Select
                label="Kind of machine"
                name="machineType"
                hint="Fills in the machine's figures below."
                items={TYPE_ITEMS}
                placeholder="Choose a kind of machine"
                value={machineType}
                onValueChange={chooseType}
              />
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
          </Fieldset>

          <Fieldset legend="The operator">
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
          </Fieldset>

          <Fieldset legend="Hours, overheads and margin">
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
          </Fieldset>
        </Stack>
      </Form>

      <Prose>
        <h2>Where each hour's cost goes</h2>
      </Prose>
      <MeasureSet scale="Bars scaled against the largest single cost in the hour.">
        {rate === null
          ? <Measure label="Fill in every figure to see the breakdown" value={null} />
          : rate.lines.map((line) => (
              <Measure
                key={line.key}
                label={line.label}
                value={dollars(line.perHour)}
                unit="per hour"
                fraction={largest > 0 ? Math.max(line.perHour, 0) / largest : 0}
              />
            ))}
      </MeasureSet>
    </Stack>
  );
}
