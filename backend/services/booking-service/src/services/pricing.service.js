/**
 * Calculates booking price based on shift type and professional's pricing.
 * All amounts in paise (integer) to avoid floating-point errors.
 */
export const calculatePrice = (professionalPricing, shiftType) => {
  const baseRates = {
    hourly: professionalPricing.hourly || 50000,
    shift_12h: professionalPricing.shift12h || 250000,
    shift_24h: professionalPricing.shift24h || 450000,
    live_in: professionalPricing.liveIn || 3000000
  };
  
  const base = baseRates[shiftType] || baseRates.hourly;
  const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
  const platformFee = Math.round(base * platformFeePercent / 100);
  
  return {
    amount: base + platformFee,
    currency: professionalPricing.currency || 'INR',
    breakdown: {
      base,
      platformFee
    }
  };
};