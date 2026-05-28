import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';

let printerInstance: ThermalPrinter | null = null;

function getPrinter(): ThermalPrinter {
  if (!printerInstance) {
    const printerType = process.env.PRINTER_TYPE || 'EPSON';
    const printerInterface = process.env.PRINTER_INTERFACE || 'tcp://192.168.1.100';

    const typeMap: Record<string, PrinterTypes> = {
      EPSON: PrinterTypes.EPSON,
      STAR: PrinterTypes.STAR,
      DARUMA: PrinterTypes.DARUMA,
      BROTHER: PrinterTypes.BROTHER,
    };

    printerInstance = new ThermalPrinter({
      type: typeMap[printerType] ?? PrinterTypes.EPSON,
      interface: printerInterface,
      characterSet: CharacterSet.PC437_USA,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      options: {
        timeout: 5000,
      },
    });
  }
  return printerInstance;
}

export interface BadgePrintData {
  tagNumber: string;
  visitorName: string;
  hostName: string;
  purpose: string;
  checkInTime: string;
}

/**
 * Print a visitor badge on the thermal printer.
 * Available for future/manual use — not auto-triggered during check-in.
 */
export async function printBadge(data: BadgePrintData): Promise<void> {
  const p = getPrinter();

  p.alignCenter();
  p.bold(true);
  p.setTextSize(1, 1);
  p.println('================================');
  p.println('MMCY VISITOR BADGE');
  p.println('================================');
  p.bold(false);
  p.newLine();

  p.alignLeft();
  p.bold(true);
  p.println(`Badge #: ${data.tagNumber}`);
  p.bold(false);
  p.newLine();

  p.println(`Visitor:  ${data.visitorName}`);
  p.println(`Host:     ${data.hostName}`);
  p.println(`Purpose:  ${data.purpose}`);
  p.println(`Time:     ${data.checkInTime}`);
  p.newLine();

  p.alignCenter();
  p.printQR(data.tagNumber, { cellSize: 6, correction: 'M', model: 2 });
  p.newLine();

  p.println('================================');
  p.println('VISITOR');
  p.println('================================');
  p.cut();

  try {
    await p.execute();
    console.log('[Printer] Badge printed successfully for:', data.visitorName);
  } catch (err) {
    console.error('[Printer] Failed to print badge:', err);
    throw err;
  }
}

/**
 * Check if the thermal printer is connected and reachable.
 */
export async function isPrinterConnected(): Promise<boolean> {
  try {
    const p = getPrinter();
    const connected = await p.isPrinterConnected();
    return connected;
  } catch {
    return false;
  }
}
