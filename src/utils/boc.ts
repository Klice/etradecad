export const BOC_VALET_URL = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json';

export const bocLookupUrl = (date: string) =>
    `https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates-lookup/?lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&series%5B%5D=FXUSDCAD&lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&rangeType=range&rangeValue=&dFrom=${date}&dTo=&submit_button=Submit`;
