const FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  '6th Floor',
  '7th Floor',
];

const STATIONS = [
  'Reception Desk 1',
  'Reception Desk 2',
  'Kiosk Tablet A',
  'Kiosk Tablet B',
  'Executive Floor Kiosk',
];

export async function searchFloors(q: string): Promise<string[]> {
  const queryStr = q.trim().toLowerCase();
  if (!queryStr) return FLOORS;
  return FLOORS.filter(f => f.toLowerCase().includes(queryStr));
}

export async function searchStations(q: string): Promise<string[]> {
  const queryStr = q.trim().toLowerCase();
  if (!queryStr) return STATIONS;
  return STATIONS.filter(s => s.toLowerCase().includes(queryStr));
}
