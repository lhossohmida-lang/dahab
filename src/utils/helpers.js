export const fmt = (n) =>
  new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 2 }).format(Number(n) || 0);

export const money = (n) => `${fmt(n)} دج`;

export const genInvoiceNumber = () => {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const startOfMonth = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x;
};

export const startOfWeek = (d = new Date()) => {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
};

export const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('ar-DZ');
};

export const CATEGORIES = [
  'خواتم',
  'أساور',
  'سلاسل',
  'أقراط',
  'ساعات',
  'مشابك شعر',
  'حقائب صغيرة',
  'مكياج وإكسسوارات',
  'أخرى',
];

export const PAYMENT_METHODS = ['نقدا', 'بريدي موب', 'CCP', 'أخرى'];
