export const getCurrentDateFormatted = () => {
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const day = now.getDate();
  const month = monthsIndo[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};

export const getCurrentLogTimeFormatted = (offsetMinutes = 0) => {
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const now = new Date();
  if (offsetMinutes) {
    now.setMinutes(now.getMinutes() + offsetMinutes);
  }
  const day = now.getDate();
  const month = monthsShort[now.getMonth()];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

export const formatLogDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.startsWith('Hari ini')) {
    const timePart = dateStr.replace('Hari ini', '').trim();
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const now = new Date();
    const day = now.getDate();
    const month = monthsShort[now.getMonth()];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    return timePart ? `${day} ${month} ${timePart}` : `${day} ${month} ${currentHours}:${currentMinutes}`;
  }
  return dateStr;
};
