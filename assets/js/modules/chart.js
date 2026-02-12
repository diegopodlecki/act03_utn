export function renderWeightChart(canvas, sessions = []) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!sessions.length) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Sin datos aún', 24, 40);
    return;
  }

  const data = sessions
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((s) => s.weight);

  const min = Math.min(...data) - 1;
  const max = Math.max(...data) + 1;
  const padX = 40;
  const padY = 20;
  const w = canvas.width - padX * 2;
  const h = canvas.height - padY * 2;

  ctx.strokeStyle = '#374151';
  ctx.beginPath();
  ctx.moveTo(padX, padY);
  ctx.lineTo(padX, canvas.height - padY);
  ctx.lineTo(canvas.width - padX, canvas.height - padY);
  ctx.stroke();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();

  data.forEach((v, i) => {
    const x = padX + (w * i) / Math.max(1, data.length - 1);
    const y = padY + h - ((v - min) / (max - min || 1)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}
