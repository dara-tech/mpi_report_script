import { useMemo } from 'react';

export const useIndicatorAnalysis = (selectedIndicator) => {
  console.log('Selected Indicator:', selectedIndicator);

  const analysis = useMemo(() => {
    if (!selectedIndicator) return { chartType: 'none', stats: { total: 0 } };

    const isMmdIndicator = selectedIndicator.hasOwnProperty('less_than_3_months') ||
                           selectedIndicator.hasOwnProperty('three_to_five_months') ||
                           selectedIndicator.hasOwnProperty('six_or_more_months');

    if (isMmdIndicator) {
      const less_than_3 = parseInt(selectedIndicator.less_than_3_months || '0', 10);
      const three_to_five = parseInt(selectedIndicator.three_to_five_months || '0', 10);
      const six_or_more = parseInt(selectedIndicator.six_or_more_months || '0', 10);

      const mmdData = [
        { name: '< 3 Months', value: less_than_3, color: '#3B82F6' },
        { name: '3-5 Months', value: three_to_five, color: '#10B981' },
        { name: '6+ Months', value: six_or_more, color: '#F59E0B' },
      ];
      
      const total = less_than_3 + three_to_five + six_or_more;

      return {
        chartType: 'mmd',
        chartData: mmdData,
        stats: { total }
      };
    }

    const male_0_14 = parseInt(selectedIndicator.male_0_14 || '0', 10);
    const female_0_14 = parseInt(selectedIndicator.female_0_14 || '0', 10);
    const male_over_14 = parseInt(selectedIndicator.male_over_14 || '0', 10);
    const female_over_14 = parseInt(selectedIndicator.female_over_14 || '0', 10);

    const barData = [
      { name: 'Male 0-14', value: male_0_14, color: '#3B82F6' },
      { name: 'Female 0-14', value: female_0_14, color: '#EC4899' },
      { name: 'Male 15+', value: male_over_14, color: '#10B981' },
      { name: 'Female 15+', value: female_over_14, color: '#F59E0B' },
    ];

    const totalMale = male_0_14 + male_over_14;
    const totalFemale = female_0_14 + female_over_14;

    const pieData = [
        { name: 'Male', value: totalMale, color: '#2563EB' },
        { name: 'Female', value: totalFemale, color: '#D946EF' },
    ];

    const calculatedStats = {
      total: totalMale + totalFemale,
      totalMale: totalMale,
      totalFemale: totalFemale,
      totalUnder15: male_0_14 + female_0_14,
      totalOver15: male_over_14 + female_over_14,
    };

    return { 
        chartType: 'age_gender',
        barChartData: barData, 
        pieChartData: pieData, 
        stats: calculatedStats 
    };
  }, [selectedIndicator]);

  return analysis;
};
