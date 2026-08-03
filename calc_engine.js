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
//main wage calculator
export function wageCalculator(hours, rate, vacHours, vacRate, reward, payer, inv1_2, inv3, ztp, premium, kidsCount) {
    hours = bad_apples(hours);
    rate = bad_apples(rate);
    vacHours = bad_apples(vacHours);
    vacRate = bad_apples(vacRate);
    reward = bad_apples(reward);
    premium = bad_apples(premium);
    kidsCount = bad_apples(kidsCount);
    let base_pay = multi(hours, rate);
    let vacation = multi(vacHours, vacRate);
    if (reward <= 0) {
        reward = 0
    }
    let true_premium = multi(base_pay, premium / 100) || 0;
    let reward_premium = true_premium + reward || 0;
    let grosswage = base_pay + vacation + reward_premium;
    let health_insur = multi(grosswage, config.healthWorker) || 0;
    let social_insur = multi(grosswage, config.socWorker) || 0;
    let tax_base = rounding_hundreds(grosswage) || 0;
    let basic_tax = multi(tax_base, config.incomeTax) || 0;
    let tax_payer = 0;
    let invalidity_1_2 = 0;
    let invalidity_3 = 0;
    let ztpValue = 0;
    if (payer) {
        tax_payer = config.payerDiscount;
    }
    if (inv1_2) {
        invalidity_1_2 = config.invalidity12;
    }
    if (inv3) {
        invalidity_3 = config.invalidity3;
    }
    if (ztp) {
        ztpValue = config.ztpValue;
    }
    let discounts = discount(tax_payer, invalidity_1_2, invalidity_3, ztpValue) || 0;
    let benefit = 0;
    if (kidsCount == 1) {
        benefit = config.kids1;
    } else if (kidsCount == 2) {
        benefit = config.kids2;
    } else if (kidsCount == 3) {
        benefit = config.kids3;
    } else if (kidsCount > 3) {
        benefit = multiple_kids_count(kidsCount);
    }
    let discounted_tax = tax_after_discount(basic_tax, discounts);
    let final_tax = tax_after_benefit(discounted_tax, benefit);
    let final_tax_checked = 0;
    let tax_bonus = 0;
    if (final_tax < 0) {
        tax_bonus = -final_tax;
        final_tax_checked = 0;
    } else {
        final_tax_checked = final_tax;
    }
    let net_pay = take_home_pay(grosswage, health_insur, social_insur, final_tax_checked);
    let supplement = net_pay + tax_bonus;
    let emp_health_insur = multi(grosswage, config.healthEmployer);
    let emp_soc_insur = multi(grosswage, config.socEmployer);
    return {
        basePay: base_pay,
        vacationPay: vacation,
        gross: grosswage,
        health: health_insur,
        social: social_insur,
        taxBase: tax_base,
        basicTax: basic_tax,
        discounts: discounts,
        benefit: benefit,
        tax: final_tax_checked,
        net: net_pay,
        bonus: tax_bonus,
        supplement: supplement,
        empHealth: emp_health_insur,
        empSocial: emp_soc_insur
    };
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