// The weekend's schedule, in one place — the RSVP form, the admin dashboard,
// and the CSV export all read from here, so adding or renaming an event is a
// one-file change.
//
// `rsvp: true` events get their own attending question and their own list of
// who's coming. The afterparty is open-invite: it shows up on the form as
// information only, with nothing to answer.

export type RsvpEventKey = "welcome" | "wedding";

export type WeekendEvent = {
  key: RsvpEventKey | "afterparty";
  /** Short name used in table headers and CSV columns. */
  label: string;
  title: string;
  when: string;
  place: string;
  address: string;
  /** Does this event collect an RSVP? */
  rsvp: boolean;
  /** Only the wedding needs dietary info (it's the one with a sit-down meal). */
  dietary: boolean;
};

export const WEEKEND: WeekendEvent[] = [
  {
    key: "welcome",
    label: "Friday welcome",
    title: "Welcome Wine/Beer/Pizza",
    when: "Friday, October 23 · 7:00 p.m.",
    place: "Bar Bandini",
    address: "2150 W. Sunset Blvd., Los Angeles",
    rsvp: true,
    dietary: false,
  },
  {
    key: "wedding",
    label: "Wedding",
    title: "The Wedding",
    when: "Saturday, October 24 · 3:30 p.m.",
    place: "Aaron Walton's backyard, Hancock Park",
    address: "322 S. Las Palmas Ave., Los Angeles",
    rsvp: true,
    dietary: true,
  },
  {
    key: "afterparty",
    label: "Afterparty",
    title: "The Afterparty",
    when: "Saturday, October 24 · 8:30 p.m.",
    place: "Thai Angel",
    address: "149 N. Western Ave., Los Angeles",
    rsvp: false,
    dietary: false,
  },
];

/** Just the events that collect a response, in order. */
export const RSVP_EVENTS = WEEKEND.filter((e) => e.rsvp) as (WeekendEvent & {
  key: RsvpEventKey;
})[];

export const RSVP_EVENT_KEYS: RsvpEventKey[] = RSVP_EVENTS.map((e) => e.key);

export function isRsvpEventKey(key: string): key is RsvpEventKey {
  return (RSVP_EVENT_KEYS as string[]).includes(key);
}
