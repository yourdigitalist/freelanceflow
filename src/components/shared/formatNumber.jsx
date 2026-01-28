// Format number based on user's personal preference
export const formatNumber = (value, numberFormat = '1,000.00') => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  
  const num = parseFloat(value);
  
  switch (numberFormat) {
    case '1.000,00': // European format
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d{2})$/, ',$1');
    case '1 000,00': // French format
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace(/ (\d{2})$/, ',$1');
    case '1,000.00': // US format (default)
    default:
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};