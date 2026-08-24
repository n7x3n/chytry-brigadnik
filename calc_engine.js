//helper functions
function multi(factor1, factor2) {
    return Math.ceil(factor1 * factor2);
}
function bad_apples(value) {
    return Math.max(0, value);
}
function rounding_hundreds(unrounded) {
    return Math.ceil(unrounded / 100) * 100;
}
function discount(payer, invalidity_1, invalidity_2, ztp) {
    return payer + invalidity_1 + invalidity_2 + ztp;
}
function multiple_kids_count(kids) {
    return 5447 + (kids - 3) * 2320;
}
function tax_after_discount(base, discounts) {
    let discounted = base - discounts;
    if (discounted < 0) {
        discounted = 0;
    }
    return discounted;
}
function tax_after_benefit(discounted, benefit) {
    return discounted - benefit;
}
function take_home_pay(gross, health, social, tax) {
    return gross - health - social - tax;
}
// configuration object
const config = {
    healthWorker: 0.045,
    socWorker: 0.071,
    incomeTax: 0.15,
    payerDiscount: 2570,
    invalidity12: 210,
    invalidity3: 420,
    ztpValue: 1345,
    kids1: 1267,
    kids2: 3127,
    kids3: 5447,
    healthEmployer: 0.09,
    socEmployer: 0.248
}
// counting shift hours
export function shiftHours(clockIn, clockOut) {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    let startMin = inH * 60 + inM;
    let endMin = outH * 60 + outM;
    if (endMin < startMin) {
        endMin += 24 * 60;
    }
    const duration = (endMin - startMin) / 60;
    return parseFloat(duration.toFixed(2));
}
////////////
////////////


const CZECH_HOLIDAYS = [
    "01-01", "05-01", "05-08", "07-05", "07-06",
    "09-28", "10-28", "11-17", "12-24", "12-25", "12-26"
];

export function shiftHoursBreakdown(shiftDate, clockIn, clockOut) {
    const [y, m, d] = shiftDate.split('-').map(Number);
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const start = new Date(y, m - 1, d, inH, inM);
    let end = new Date(y, m - 1, d, outH, outM);
    if (end <= start) {
        end.setDate(end.getDate() + 1);
    }
    const totalHours = parseFloat(((end - start) / (1000 * 60 * 60)).toFixed(2));
    let weekendHours = 0;
    let holidayHours = 0;
    let nightHours = 0;
    let curr = new Date(start);
    const stepMin = 15;
    while (curr < end) {
        const dayOfWeek = curr.getDay();
        const hour = curr.getHours();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isNight = (hour >= 22 || hour < 6);
        const monthDay = `${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).
            padStart(2, '0')}`;
        const isHoliday = CZECH_HOLIDAYS.includes(monthDay);
        if (isWeekend) weekendHours += stepMin / 60;
        if (isNight) nightHours += stepMin / 60;
        if (isHoliday) holidayHours += stepMin / 60;
        curr.setMinutes(curr.getMinutes() + stepMin);
    }
    return {
        totalHours,
        weekendHours: parseFloat(weekendHours.toFixed(2)),
        nightHours: parseFloat(nightHours.toFixed(2)),
        holidayHours: parseFloat(holidayHours.toFixed(2))
    };
}
export function calculateNetWage(grossWage, jobConfig = {}) {
    const contractType = jobConfig.contractType || 'dpp';
    const isPayer = !!jobConfig.taxPayer;
    const insuranceLimit = (contractType === 'dpc') ? 4000 : 10500;
    const isInsuranceApplied = (grossWage > insuranceLimit);
    let healthInsurance = 0;
    let socialInsurance = 0;
    if (isInsuranceApplied) {
        healthInsurance = Math.ceil(grossWage * config.healthWorker);
        socialInsurance = Math.ceil(grossWage * config.socWorker);
    }
    let rawTax = Math.ceil(grossWage * 0.15);
    let taxDiscount = 0;
    let finalTax = 0;
    let taxBonus = 0;
    if (isPayer) {
        taxDiscount = 2570;
        if (jobConfig.inv12) taxDiscount += 210;
        if (jobConfig.inv3) taxDiscount += 420;
        if (jobConfig.ztp) taxDiscount += 1345;
        let kidsBenefit = 0;
        const kids = parseInt(jobConfig.kidsCount, 10) || 0;
        if (kids === 1) kidsBenefit = 1267;
        else if (kids === 2) kidsBenefit = 3127;
        else if (kids === 3) kidsBenefit = 5447;
        else if (kids > 3) kidsBenefit = 5447 + (kids - 3) * 2320;
        const taxAfterDiscounts = rawTax - taxDiscount;
        if (taxAfterDiscounts > 0) {
            finalTax = Math.max(0, taxAfterDiscounts - kidsBenefit);
        } else {
            finalTax = 0;
            if (kidsBenefit > 0) {
                taxBonus = Math.min(kidsBenefit, Math.abs(taxAfterDiscounts));
            }
        }
    } else {
        finalTax = rawTax;
    }
    const netWage = grossWage - healthInsurance - socialInsurance - finalTax + taxBonus;
    return {
        gross: grossWage,
        health: healthInsurance,
        social: socialInsurance,
        tax: finalTax,
        bonus: taxBonus,
        discounts: taxDiscount,
        net: netWage,
        isInsuranceApplied
    };
}