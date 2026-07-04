import * as QRCode from 'qrcode';

export class QrGeneratorUtil {
  /**
   * Generates a DataURL (base64 PNG) QR code string for a given Job Card or Sub Job Card ID/No.
   */
  static async generateDataUrl(data: string): Promise<string> {
    return QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Generates an SVG string representation of a QR code.
   */
  static async generateSvg(data: string): Promise<string> {
    return QRCode.toString(data, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
    });
  }
}
