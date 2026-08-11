export const INVOICE_TYPES = Object.freeze({
  individual: 'Bireysel',
  corporate: 'Kurumsal'
});

export function invoiceDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizePhone(value) {
  const raw = String(value || '').trim();
  const digits = invoiceDigits(raw);
  if (digits.length === 10) return `+90${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+90${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('90')) return `+${digits}`;
  return raw.startsWith('+') ? `+${digits}` : digits;
}

export function normalizeInvoiceData(value = {}) {
  const invoiceType = value.invoiceType === 'corporate' ? 'corporate' : 'individual';
  return {
    invoiceType,
    phone: normalizePhone(value.phone),
    companyTitle: invoiceType === 'corporate' ? String(value.companyTitle || '').trim() : '',
    taxNumber: invoiceDigits(value.taxNumber),
    taxOffice: invoiceType === 'corporate' ? String(value.taxOffice || '').trim() : '',
    billingAddress: String(value.billingAddress || '').trim(),
    billingDistrict: String(value.billingDistrict || '').trim(),
    billingCity: String(value.billingCity || '').trim()
  };
}

export function invoiceValidationIssue(value = {}) {
  const data = normalizeInvoiceData(value);
  if (!Object.hasOwn(INVOICE_TYPES, value.invoiceType)) {
    return { field: 'invoiceType', message: 'Fatura türünü seçin.' };
  }
  if (!/^\+?\d{10,15}$/.test(data.phone)) {
    return { field: 'phone', message: 'İletişim için geçerli bir telefon numarası girin.' };
  }
  if (data.invoiceType === 'corporate' && data.companyTitle.length < 2) {
    return { field: 'companyTitle', message: 'Fatura için şirketin ticari unvanını girin.' };
  }
  if (data.invoiceType === 'individual' && !/^[1-9]\d{10}$/.test(data.taxNumber)) {
    return { field: 'taxNumber', message: 'Bireysel fatura için 11 haneli T.C. kimlik numarasını kontrol edin.' };
  }
  if (data.invoiceType === 'corporate' && (!/^\d{10}$/.test(data.taxNumber) || /^0+$/.test(data.taxNumber))) {
    return { field: 'taxNumber', message: 'Kurumsal fatura için 10 haneli vergi kimlik numarasını kontrol edin.' };
  }
  if (data.invoiceType === 'corporate' && data.taxOffice.length < 2) {
    return { field: 'taxOffice', message: 'Kurumsal fatura için vergi dairesini girin.' };
  }
  if (data.billingAddress.length < 10) {
    return { field: 'billingAddress', message: 'Faturada kullanılacak açık adresi eksiksiz girin.' };
  }
  if (data.billingDistrict.length < 2) {
    return { field: 'billingDistrict', message: 'Fatura adresinin ilçesini girin.' };
  }
  if (data.billingCity.length < 2) {
    return { field: 'billingCity', message: 'Fatura adresinin ilini girin.' };
  }
  return null;
}
