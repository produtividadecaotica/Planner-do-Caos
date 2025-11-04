import { RRule, RRuleSet, rrulestr } from "rrule";
import { DateTime } from "luxon";

export function buildRule(freq, interval = 1, until = null) {
  const options = {
    freq: freq,
    interval: interval,
    dtstart: new Date(),
  }
  
  if (until) {
    options.until = until
  }
  
  return new RRule(options)
}

/** Constrói uma RRULE string a partir de opções simples */
export function buildRRuleString({
  dtstartISO,                 // ISO da primeira ocorrência
  freq = "WEEKLY",            // DAILY | WEEKLY | MONTHLY | YEARLY
  interval = 1,
  count,                      // opcional
  untilISO,                   // opcional (inclui o dia)
  byweekday = [],             // [0..6] (domingo..sábado)
  bysetpos,                   // ex.: -1 (último)
  bymonthday,                 // ex.: 15
}) {
  const start = DateTime.fromISO(dtstartISO);
  const mapFreq = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  };

  const opts = {
    dtstart: start.toJSDate(),
    freq: mapFreq[freq] ?? RRule.WEEKLY,
    interval: Number(interval) || 1,
  };

  if (count) opts.count = Number(count);

  if (untilISO) {
    const u = DateTime.fromISO(untilISO).endOf("day");
    opts.until = u.toJSDate();
  }

  if (Array.isArray(byweekday) && byweekday.length) {
    opts.byweekday = byweekday.map((d) => RRule.weekday(Number(d)));
  }

  if (bysetpos != null && bysetpos !== "") {
    opts.bysetpos = Number(bysetpos);
  }

  if (bymonthday != null && bymonthday !== "") {
    opts.bymonthday = Number(bymonthday);
  }

  return new RRule(opts).toString();
}

/** Faz parse seguro de uma RRULE string em objeto RRule/RRuleSet */
export function parseRRule(rruleString) {
  if (!rruleString || typeof rruleString !== "string") return null;
  try {
    return rrulestr(rruleString, { forceset: false });
  } catch {
    try {
      // Tenta como set se veio com RRULE:\nEXDATE...
      return rrulestr(rruleString, { forceset: true });
    } catch {
      return null;
    }
  }
}

/** Expande ocorrências entre duas datas (ISO), limitado por maxCount */
export function expandOccurrences({
  rruleString,
  rangeStartISO,
  rangeEndISO,
  maxCount = 100
}) {
  const rule = RRule.fromString(rruleString)
  const start = new Date(rangeStartISO)
  const end = new Date(rangeEndISO)
  
  return rule.between(start, end, true)
    .slice(0, maxCount)
    .map(date => date.toISOString())
}

/** Próxima ocorrência a partir de um instante (inclusive) */
export function nextOccurrence(rruleString, fromISO = DateTime.now().toISO()) {
  const rule = parseRRule(rruleString);
  if (!rule) return null;
  const from = DateTime.fromISO(fromISO).toJSDate();
  const next = rule.after(from, true);
  return next ? DateTime.fromJSDate(next).toISO() : null;
}

/** Converte RRULE em texto legível (PT-BR) de forma compacta */
export function humanizeRRule(rruleString) {
  const rule = parseRRule(rruleString);
  if (!rule) return "Sem recorrência";
  const o = rule.origOptions || {};
  const fmt = [];

  // Frequência
  const freqMap = {
    [RRule.DAILY]: "Diariamente",
    [RRule.WEEKLY]: "Semanalmente",
    [RRule.MONTHLY]: "Mensalmente",
    [RRule.YEARLY]: "Anualmente",
  };
  if (o.freq != null) fmt.push(freqMap[o.freq] || "Recorrente");

  // Intervalo
  if (o.interval && o.interval > 1) fmt.push(`a cada ${o.interval}`);

  // Dias da semana
  if (Array.isArray(o.byweekday) && o.byweekday.length) {
    const dias = o.byweekday
      .map((w) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday || w])
      .join(", ");
    fmt.push(`em ${dias}`);
  }

  // Dia do mês
  if (o.bymonthday) fmt.push(`no dia ${o.bymonthday}`);

  // Posição (ex.: última sexta)
  if (o.bysetpos) fmt.push(`(posição ${o.bysetpos})`);

  // Até/contagem
  if (o.count) fmt.push(`por ${o.count} ocorrências`);
  if (o.until) fmt.push(`até ${DateTime.fromJSDate(o.until).toFormat("dd/LL/yyyy")}`);

  return fmt.join(" ");
}

/** Cria presets prontos que você usa no RecurrenceEditor */
export const RRULE_PRESETS = {
  none: () => "",
  daily: (dtstartISO) => buildRRuleString({ dtstartISO, freq: "DAILY" }),
  workdays: (dtstartISO) =>
    buildRRuleString({ dtstartISO, freq: "WEEKLY", byweekday: [1, 2, 3, 4, 5] }),
  weekly: (dtstartISO) => buildRRuleString({ dtstartISO, freq: "WEEKLY" }),
  biweekly: (dtstartISO) => buildRRuleString({ dtstartISO, freq: "DAILY", interval: 15 }),
  monthly: (dtstartISO) => buildRRuleString({ dtstartISO, freq: "MONTHLY" }),
  lastFriday: (dtstartISO) =>
    new RRule({
      dtstart: DateTime.fromISO(dtstartISO).toJSDate(),
      freq: RRule.MONTHLY,
      byweekday: [RRule.FR.weekday(4)],
      bysetpos: -1,
    }).toString(),
  yearly: (dtstartISO) => buildRRuleString({ dtstartISO, freq: "YEARLY" }),
};