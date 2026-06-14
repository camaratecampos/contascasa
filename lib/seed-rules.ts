export const SEED_RULES = [
  // Supermercado
  { keyword: 'PINGO DOCE', category: 'Supermercado', subcategory: '' },
  { keyword: 'PAD PORT JOAO XXI', category: 'Supermercado', subcategory: '' },
  { keyword: 'CELEIRO', category: 'Supermercado', subcategory: '' },
  { keyword: 'MERCADONA', category: 'Supermercado', subcategory: '' },
  { keyword: 'LIDL', category: 'Supermercado', subcategory: '' },
  { keyword: 'MAKRO', category: 'Supermercado', subcategory: '' },
  { keyword: 'ANJANI', category: 'Supermercado', subcategory: '' },
  { keyword: 'CONTINENTE', category: 'Supermercado', subcategory: '' },
  { keyword: 'EL CORTE INGLES', category: 'Supermercado', subcategory: '' },
  // Saúde
  { keyword: 'SUPERA AREEIRO', category: 'Saúde', subcategory: 'Ginásio' },
  { keyword: 'FARMACIA', category: 'Saúde', subcategory: '' },
  { keyword: 'HOSPITAL', category: 'Saúde', subcategory: '' },
  { keyword: 'CLINICA', category: 'Saúde', subcategory: '' },
  { keyword: 'CUF', category: 'Saúde', subcategory: '' },
  { keyword: 'MEDIS', category: 'Saúde', subcategory: 'Seguro' },
  { keyword: 'MULTICARE', category: 'Saúde', subcategory: 'Seguro' },
  { keyword: 'GAMALIFE', category: 'Saúde', subcategory: 'Seguro' },
  { keyword: 'CDCR CLINICA', category: 'Saúde', subcategory: '' },
  { keyword: 'HOSPITAL DA LUZ', category: 'Saúde', subcategory: '' },
  // Casa
  { keyword: 'PAGAMENTO PRESTACAO', category: 'Casa', subcategory: 'Crédito' },
  { keyword: 'PAGAMENTO DE CONTA CREDITO', category: 'Casa', subcategory: 'Crédito' },
  { keyword: 'LISBOAGAS', category: 'Casa', subcategory: 'Gás' },
  { keyword: 'MANUTENCAO CONTA', category: 'Outros', subcategory: 'Comissões' },
  { keyword: 'COM.MAN.CONTA', category: 'Outros', subcategory: 'Comissões' },
  { keyword: 'IMPOSTO SELO', category: 'Outros', subcategory: 'Impostos' },
  // Carro
  { keyword: 'ESLI PARQUES', category: 'Carro', subcategory: 'Estacionamento' },
  { keyword: 'PAGAMENTO BAIXO VALOR', category: 'Carro', subcategory: 'Via Verde' },
  // Restaurantes
  { keyword: 'TREEGO', category: 'Restaurantes', subcategory: '' },
  { keyword: 'B PERFECT', category: 'Restaurantes', subcategory: '' },
  { keyword: 'RUBRO', category: 'Restaurantes', subcategory: '' },
  { keyword: 'TAQUEIRA', category: 'Restaurantes', subcategory: '' },
  { keyword: 'TIVOLI', category: 'Restaurantes', subcategory: '' },
  { keyword: 'EXOTIC TERRACE', category: 'Restaurantes', subcategory: '' },
  { keyword: 'SEASIDE', category: 'Restaurantes', subcategory: '' },
  { keyword: 'FELIZ LONDRES', category: 'Restaurantes', subcategory: '' },
  { keyword: 'RESTAURANTE', category: 'Restaurantes', subcategory: '' },
  // Ordenados
  { keyword: 'TRANSFERENCIA - VENCIMENTO', category: 'Ordenados', subcategory: '' },
  { keyword: 'HIKMA FARMACEUTICA', category: 'Ordenados', subcategory: '' },
  // Miúdos (former Escola keywords moved here)
  { keyword: 'ORDEM PERMANENTE SEPA+ PARA ANTONIO CAMARATE', category: 'Miúdos', subcategory: '' },
  { keyword: 'ORDEM PERMANENTE SEPA+ MENSAL PARA JOAO MARIA', category: 'Miúdos', subcategory: '' },
  { keyword: 'ORDEM PERMANENTE SEPA+ MENSAL PARA MARIA DA LUZ', category: 'Miúdos', subcategory: '' },
  { keyword: 'ORDEM PERMANENTE SEPA+ TRANSFERENCIA MENSAL PARA DOMINGOS', category: 'Miúdos', subcategory: '' },
  // Viagens
  { keyword: 'TICKET LINE', category: 'Viagens', subcategory: '' },
  { keyword: 'MBWAY IFTHENPAY', category: 'Viagens', subcategory: '' },
];

// Re-export from the canonical source so existing imports still work.
export { CATEGORIES } from './categories';
export type { Category } from './categories';
