/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

const S_MIN = 60;
const S_HR = 60 * S_MIN;
const S_DAY = 24 * S_HR;
const S_WEEK = 7 * S_DAY;
const units = {
  // minute units
  minute: S_MIN,
  minutes: S_MIN,
  min: S_MIN,
  mins: S_MIN,
  m: S_MIN,

  // hour units
  hour: S_HR,
  hours: S_HR,
  hr: S_HR,
  hrs: S_HR,
  h: S_HR,

  // day units
  day: S_DAY,
  days: S_DAY,
  d: S_DAY,

  // week units
  week: S_WEEK,
  weeks: S_WEEK,
  wk: S_WEEK,
  wks: S_WEEK,
  w: S_WEEK,
};

// the semantic string is either a 'now' or a minus value of a unit.
const pattern = /(?<now>now)|-(?<count>\d+)(?<unit>\w+)/i;
const k_now = 'now';
const k_count = 'count';
const k_unit = 'unit';
const ms = (x: any) => Math.round(new Date(x).getTime() / 1000);

export const seconds = (ds: any) => {
  if (ds === null || ds === undefined) {
    return 0;
  }

  const digsOnly = +ds == ds;
  // digit only expression is just a utc unix time in seconds
  if (digsOnly) {
    return ms(+ds);
  }

  // relative time value needs to convert, try to detect it
  const str = `${ds}`.toLowerCase();
  const m = str.match(pattern);
  if (m && m.groups) {
    // check if it is now
    if (m.groups[k_now]) {
      return ms(Date.now());
    }

    // check unit
    const u = m.groups[k_unit];
    if (u in units) {
      const delta = +m.groups[k_count] * units[u];
      return ms(Date.now() - delta * 1000);
    }
  }

  // absolute time value in a time string like '2020-07-07 10:05:03'
  return ms(`${ds} UTC`);
};