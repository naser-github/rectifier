/**
 * First-visit sample loaded when no saved workspace exists.
 *
 * Source: doc/prd.md §6.4
 */
export const SAMPLE_JSON: string = JSON.stringify(
  {
    name: "John",
    active: true,
    contact: {
      city: "Dhaka",
      email: "john@example.com",
    },
    roles: ["editor", "viewer"],
  },
  null,
  2,
);
