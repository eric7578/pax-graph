export type Pax = {
  count: number;
  nationality: string;
  age: string;
};

export type Log = {
  range: [string, string];
  leave: Pax[];
  enter: Pax[];
};
