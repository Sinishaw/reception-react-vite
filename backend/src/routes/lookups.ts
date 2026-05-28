import { Router, Request, Response } from 'express';

const router = Router();

// Static floor directory (matches Flutter's FloorService._allFloors)
const ALL_FLOORS = [
  'Floor 1 - Main Lobby & Concierge',
  'Floor 2 - Engineering & Developer Hub',
  'Floor 3 - Marketing, Design & Creative Lab',
  'Floor 4 - Human Resources & Finance Operations',
  'Floor 5 - Executive Suites & Boardrooms',
  'Floor 6 - Conference & Innovation Center',
  'Penthouse - Sky Lounge & Partner Offices',
  'Basement - Secure Research & Tech Vault',
];

// Static station directory (matches Flutter's StationService._mockStations)
const ALL_STATIONS = [
  'Lobby A - Main Entrance',
  'Lobby B - East Tower',
  'Floor 2 Reception',
  'Floor 5 Executive Reception',
  'R&D Lab Reception',
];

// GET /api/floors?q= — Search floor directory
router.get('/floors', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  if (!query) {
    res.json(ALL_FLOORS);
    return;
  }

  const filtered = ALL_FLOORS.filter(floor =>
    floor.toLowerCase().includes(query)
  );
  res.json(filtered);
});

// GET /api/stations?q= — Search station directory
router.get('/stations', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  if (!query) {
    res.json(ALL_STATIONS);
    return;
  }

  const filtered = ALL_STATIONS.filter(station =>
    station.toLowerCase().includes(query)
  );
  res.json(filtered);
});

export default router;
