import QRCode from 'qrcode';

export interface QROptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  logoSrc?: string;
  logoSizeRatio?: number;
}

export function drawQRCodeWithLogo(
  canvas: HTMLCanvasElement,
  payload: string,
  options: QROptions = {}
): Promise<void> {
  const {
    width = 320,
    margin = 2,
    darkColor = '#250847', // Rich deep purple (QR Code Monkey style)
    lightColor = '#ffffff', // Crisp white background
    logoSrc = '/fpa-logo.png',
    logoSizeRatio = 0.22,
  } = options;

  return new Promise((resolve, reject) => {
    QRCode.toCanvas(
      canvas,
      payload,
      {
        width,
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H', // High (30% error recovery) allows center logo
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        if (!logoSrc) {
          resolve();
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve();
          return;
        }

        const img = new Image();
        img.src = logoSrc;
        img.onload = () => {
          const logoSize = width * logoSizeRatio;
          const padding = logoSize * 0.15;
          const bgSize = logoSize + padding * 2;
          const x = (width - bgSize) / 2;
          const y = (width - bgSize) / 2;
          const radius = bgSize * 0.2;

          ctx.save();

          // 1. Draw rounded white container badge with subtle shadow
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(36, 7, 66, 0.35)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          drawRoundedRect(ctx, x, y, bgSize, bgSize, radius);
          ctx.fill();

          // 2. Draw refined purple border around badge (QR Code Monkey standard)
          ctx.shadowColor = 'transparent';
          ctx.lineWidth = Math.max(1.5, width * 0.006);
          ctx.strokeStyle = '#9333ea';
          ctx.stroke();

          // 3. Draw FPA logo centered inside the badge
          const imgX = (width - logoSize) / 2;
          const imgY = (width - logoSize) / 2;
          const imgRadius = radius * 0.75;

          ctx.beginPath();
          drawRoundedRect(ctx, imgX, imgY, logoSize, logoSize, imgRadius);
          ctx.clip();

          ctx.drawImage(img, imgX, imgY, logoSize, logoSize);

          ctx.restore();
          resolve();
        };

        img.onerror = (e) => {
          console.warn('Could not load FPA logo for QR code:', e);
          resolve();
        };
      }
    );
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
