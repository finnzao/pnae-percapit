/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');

// Enum das categorias (copiado do TypeScript)
const CategoriaAlimento = {
  ABASTECIMENTO: 'Abastecimento',
  HORTIFRUTI: 'Hortifrútis',
  PROTEINAS: 'Proteínas',
  GRAOS_CEREAIS: 'Grãos e Cereais',
  LATICINIOS: 'Laticínios',
  BEBIDAS: 'Bebidas',
  CONDIMENTOS: 'Condimentos e Temperos',
  DOCES_SOBREMESAS: 'Doces e Sobremesas',
  PANIFICACAO: 'Panificação',
  CONSERVAS: 'Conservas e Enlatados',
  CONGELADOS: 'Congelados',
  OUTROS: 'Outros'
};

// Mapeamento expandido de alimentos para categorias
const MAPEAMENTO_CATEGORIA_AUTOMATICO = {
  // ===== ABASTECIMENTO =====
  'COLORAU': CategoriaAlimento.ABASTECIMENTO,
  'AÇÚCAR': CategoriaAlimento.ABASTECIMENTO,
  'AÇÚCAR CRISTAL': CategoriaAlimento.ABASTECIMENTO,
  'AÇÚCAR REFINADO': CategoriaAlimento.ABASTECIMENTO,
  'AÇÚCAR DEMERARA': CategoriaAlimento.ABASTECIMENTO,
  'MACARRÃO': CategoriaAlimento.ABASTECIMENTO,
  'MACARRÃO ESPAGUETE': CategoriaAlimento.ABASTECIMENTO,
  'MACARRÃO PARAFUSO': CategoriaAlimento.ABASTECIMENTO,
  'MACARRÃO PENNE': CategoriaAlimento.ABASTECIMENTO,
  'MASSA': CategoriaAlimento.ABASTECIMENTO,
  'FEIJÃO': CategoriaAlimento.ABASTECIMENTO,
  'FEIJÃO CARIOCA': CategoriaAlimento.ABASTECIMENTO,
  'FEIJÃO PRETO': CategoriaAlimento.ABASTECIMENTO,
  'FEIJÃO FRADINHO': CategoriaAlimento.ABASTECIMENTO,
  'FEIJÃO BRANCO': CategoriaAlimento.ABASTECIMENTO,
  'ARROZ': CategoriaAlimento.ABASTECIMENTO,
  'ARROZ BRANCO': CategoriaAlimento.ABASTECIMENTO,
  'ARROZ INTEGRAL': CategoriaAlimento.ABASTECIMENTO,
  'ARROZ PARBOILIZADO': CategoriaAlimento.ABASTECIMENTO,
  'BISCOITO SALGADO': CategoriaAlimento.ABASTECIMENTO,
  'BOLACHA SALGADA': CategoriaAlimento.ABASTECIMENTO,
  'FLOCOS DE MILHO': CategoriaAlimento.ABASTECIMENTO,
  'FARINHA DE MANDIOCA': CategoriaAlimento.ABASTECIMENTO,
  'FARINHA DE TRIGO': CategoriaAlimento.ABASTECIMENTO,
  'FARINHA': CategoriaAlimento.ABASTECIMENTO,
  'CAFÉ': CategoriaAlimento.ABASTECIMENTO,
  'CAFÉ EM PÓ': CategoriaAlimento.ABASTECIMENTO,
  'CAFÉ MOÍDO': CategoriaAlimento.ABASTECIMENTO,
  'TAPIOCA SECA': CategoriaAlimento.ABASTECIMENTO,
  'TAPIOCA': CategoriaAlimento.ABASTECIMENTO,
  'GOMA DE TAPIOCA': CategoriaAlimento.ABASTECIMENTO,
  'LEITE EM PÓ': CategoriaAlimento.ABASTECIMENTO,
  'SARDINHA': CategoriaAlimento.ABASTECIMENTO,
  'PROTEÍNA DE SOJA': CategoriaAlimento.ABASTECIMENTO,
  'ÓLEO': CategoriaAlimento.ABASTECIMENTO,
  'ÓLEO DE SOJA': CategoriaAlimento.ABASTECIMENTO,
  'ÓLEO DE MILHO': CategoriaAlimento.ABASTECIMENTO,
  'ÓLEO DE GIRASSOL': CategoriaAlimento.ABASTECIMENTO,
  'SAL': CategoriaAlimento.ABASTECIMENTO,
  'SAL REFINADO': CategoriaAlimento.ABASTECIMENTO,
  'SAL GROSSO': CategoriaAlimento.ABASTECIMENTO,
  'VINAGRE': CategoriaAlimento.ABASTECIMENTO,
  'FUBÁ': CategoriaAlimento.ABASTECIMENTO,
  'POLVILHO': CategoriaAlimento.ABASTECIMENTO,
  
  // ===== PROTEÍNAS =====
  'CARNE BOVINA': CategoriaAlimento.PROTEINAS,
  'CARNE BOVINA (MUSCULO)': CategoriaAlimento.PROTEINAS,
  'CARNE': CategoriaAlimento.PROTEINAS,
  'MÚSCULO': CategoriaAlimento.PROTEINAS,
  'ALCATRA': CategoriaAlimento.PROTEINAS,
  'PICANHA': CategoriaAlimento.PROTEINAS,
  'CONTRA FILÉ': CategoriaAlimento.PROTEINAS,
  'FILÉ MIGNON': CategoriaAlimento.PROTEINAS,
  'COSTELA': CategoriaAlimento.PROTEINAS,
  'PATINHO': CategoriaAlimento.PROTEINAS,
  'LINGUIÇA': CategoriaAlimento.PROTEINAS,
  'LINGUIÇA CALABRESA': CategoriaAlimento.PROTEINAS,
  'LINGUIÇA TOSCANA': CategoriaAlimento.PROTEINAS,
  'SALSICHA': CategoriaAlimento.PROTEINAS,
  'PRESUNTO': CategoriaAlimento.PROTEINAS,
  'MORTADELA': CategoriaAlimento.PROTEINAS,
  'FRANGO': CategoriaAlimento.PROTEINAS,
  'FRANGO INTEIRO': CategoriaAlimento.PROTEINAS,
  'PEITO DE FRANGO': CategoriaAlimento.PROTEINAS,
  'COXA DE FRANGO': CategoriaAlimento.PROTEINAS,
  'SOBRECOXA': CategoriaAlimento.PROTEINAS,
  'ASA DE FRANGO': CategoriaAlimento.PROTEINAS,
  'PEIXE': CategoriaAlimento.PROTEINAS,
  'TILÁPIA': CategoriaAlimento.PROTEINAS,
  'SALMÃO': CategoriaAlimento.PROTEINAS,
  'MERLUZA': CategoriaAlimento.PROTEINAS,
  'BACALHAU': CategoriaAlimento.PROTEINAS,
  'PESCADA': CategoriaAlimento.PROTEINAS,
  'CAMARÃO': CategoriaAlimento.PROTEINAS,
  'OVO': CategoriaAlimento.PROTEINAS,
  'OVOS': CategoriaAlimento.PROTEINAS,
  'CLARA DE OVO': CategoriaAlimento.PROTEINAS,
  'GEMA DE OVO': CategoriaAlimento.PROTEINAS,
  
  // ===== HORTIFRÚTIS =====
  // Temperos e Aromáticos
  'ALHO': CategoriaAlimento.HORTIFRUTI,
  'CEBOLA': CategoriaAlimento.HORTIFRUTI,
  'CEBOLA ROXA': CategoriaAlimento.HORTIFRUTI,
  'CEBOLINHA': CategoriaAlimento.HORTIFRUTI,
  'CHEIRO VERDE': CategoriaAlimento.HORTIFRUTI,
  'COENTRO': CategoriaAlimento.HORTIFRUTI,
  'SALSA': CategoriaAlimento.HORTIFRUTI,
  'MANJERICÃO': CategoriaAlimento.HORTIFRUTI,
  'HORTELÃ': CategoriaAlimento.HORTIFRUTI,
  
  // Legumes
  'TOMATE': CategoriaAlimento.HORTIFRUTI,
  'TOMATE CEREJA': CategoriaAlimento.HORTIFRUTI,
  'PIMENTÃO': CategoriaAlimento.HORTIFRUTI,
  'PIMENTÃO VERDE': CategoriaAlimento.HORTIFRUTI,
  'PIMENTÃO VERMELHO': CategoriaAlimento.HORTIFRUTI,
  'PIMENTÃO AMARELO': CategoriaAlimento.HORTIFRUTI,
  'BATATA': CategoriaAlimento.HORTIFRUTI,
  'BATATA INGLESA': CategoriaAlimento.HORTIFRUTI,
  'BATATA DOCE': CategoriaAlimento.HORTIFRUTI,
  'BATATA BAROA': CategoriaAlimento.HORTIFRUTI,
  'MANDIOCA': CategoriaAlimento.HORTIFRUTI,
  'MACAXEIRA': CategoriaAlimento.HORTIFRUTI,
  'AIPIM': CategoriaAlimento.HORTIFRUTI,
  'CENOURA': CategoriaAlimento.HORTIFRUTI,
  'BETERRABA': CategoriaAlimento.HORTIFRUTI,
  'ABOBRINHA': CategoriaAlimento.HORTIFRUTI,
  'ABÓBORA': CategoriaAlimento.HORTIFRUTI,
  'ABÓBORA CABOTIÁ': CategoriaAlimento.HORTIFRUTI,
  'PEPINO': CategoriaAlimento.HORTIFRUTI,
  'BERINJELA': CategoriaAlimento.HORTIFRUTI,
  'CHUCHU': CategoriaAlimento.HORTIFRUTI,
  'QUIABO': CategoriaAlimento.HORTIFRUTI,
  'JILÓ': CategoriaAlimento.HORTIFRUTI,
  'VAGEM': CategoriaAlimento.HORTIFRUTI,
  'NABO': CategoriaAlimento.HORTIFRUTI,
  'RABANETE': CategoriaAlimento.HORTIFRUTI,
  'INHAME': CategoriaAlimento.HORTIFRUTI,
  'CARÁ': CategoriaAlimento.HORTIFRUTI,
  
  // Verduras
  'COUVE': CategoriaAlimento.HORTIFRUTI,
  'COUVE-FLOR': CategoriaAlimento.HORTIFRUTI,
  'BRÓCOLIS': CategoriaAlimento.HORTIFRUTI,
  'ALFACE': CategoriaAlimento.HORTIFRUTI,
  'ALFACE AMERICANA': CategoriaAlimento.HORTIFRUTI,
  'ALFACE CRESPA': CategoriaAlimento.HORTIFRUTI,
  'RÚCULA': CategoriaAlimento.HORTIFRUTI,
  'AGRIÃO': CategoriaAlimento.HORTIFRUTI,
  'ESPINAFRE': CategoriaAlimento.HORTIFRUTI,
  'ACELGA': CategoriaAlimento.HORTIFRUTI,
  'REPOLHO': CategoriaAlimento.HORTIFRUTI,
  'REPOLHO ROXO': CategoriaAlimento.HORTIFRUTI,
  'COUVE DE BRUXELAS': CategoriaAlimento.HORTIFRUTI,
  'CHICÓRIA': CategoriaAlimento.HORTIFRUTI,
  'ENDÍVIA': CategoriaAlimento.HORTIFRUTI,
  
  // Frutas Cítricas
  'LIMÃO': CategoriaAlimento.HORTIFRUTI,
  'LIMA': CategoriaAlimento.HORTIFRUTI,
  'LARANJA': CategoriaAlimento.HORTIFRUTI,
  'LARANJA PERA': CategoriaAlimento.HORTIFRUTI,
  'LARANJA LIMA': CategoriaAlimento.HORTIFRUTI,
  'TANGERINA': CategoriaAlimento.HORTIFRUTI,
  'MEXERICA': CategoriaAlimento.HORTIFRUTI,
  'BERGAMOTA': CategoriaAlimento.HORTIFRUTI,
  'POMELO': CategoriaAlimento.HORTIFRUTI,
  'TORANJA': CategoriaAlimento.HORTIFRUTI,
  
  // Frutas Tropicais
  'BANANA': CategoriaAlimento.HORTIFRUTI,
  'BANANA PRATA': CategoriaAlimento.HORTIFRUTI,
  'BANANA NANICA': CategoriaAlimento.HORTIFRUTI,
  'BANANA DA TERRA': CategoriaAlimento.HORTIFRUTI,
  'MAMÃO': CategoriaAlimento.HORTIFRUTI,
  'PAPAYA': CategoriaAlimento.HORTIFRUTI,
  'ABACAXI': CategoriaAlimento.HORTIFRUTI,
  'MANGA': CategoriaAlimento.HORTIFRUTI,
  'COCO': CategoriaAlimento.HORTIFRUTI,
  'MARACUJÁ': CategoriaAlimento.HORTIFRUTI,
  'GOIABA': CategoriaAlimento.HORTIFRUTI,
  'ACEROLA': CategoriaAlimento.HORTIFRUTI,
  'CAJÁ': CategoriaAlimento.HORTIFRUTI,
  'CAJU': CategoriaAlimento.HORTIFRUTI,
  'PITANGA': CategoriaAlimento.HORTIFRUTI,
  'JABUTICABA': CategoriaAlimento.HORTIFRUTI,
  'FRUTA DO CONDE': CategoriaAlimento.HORTIFRUTI,
  'GRAVIOLA': CategoriaAlimento.HORTIFRUTI,
  
  // Frutas Temperadas
  'MAÇÃ': CategoriaAlimento.HORTIFRUTI,
  'MAÇÃ GALA': CategoriaAlimento.HORTIFRUTI,
  'MAÇÃ FUJI': CategoriaAlimento.HORTIFRUTI,
  'PÊRA': CategoriaAlimento.HORTIFRUTI,
  'PÊSSEGO': CategoriaAlimento.HORTIFRUTI,
  'AMEIXA': CategoriaAlimento.HORTIFRUTI,
  'UVA': CategoriaAlimento.HORTIFRUTI,
  'UVA VERDE': CategoriaAlimento.HORTIFRUTI,
  'UVA ROXA': CategoriaAlimento.HORTIFRUTI,
  'MORANGO': CategoriaAlimento.HORTIFRUTI,
  'FRAMBOESA': CategoriaAlimento.HORTIFRUTI,
  'MIRTILO': CategoriaAlimento.HORTIFRUTI,
  'AMORA': CategoriaAlimento.HORTIFRUTI,
  'KIWI': CategoriaAlimento.HORTIFRUTI,
  'FIGO': CategoriaAlimento.HORTIFRUTI,
  'CAQUI': CategoriaAlimento.HORTIFRUTI,
  'MELÃO': CategoriaAlimento.HORTIFRUTI,
  'MELANCIA': CategoriaAlimento.HORTIFRUTI,
  
  // ===== GRÃOS E CEREAIS =====
  'MILHO': CategoriaAlimento.GRAOS_CEREAIS,
  'MILHO VERDE': CategoriaAlimento.GRAOS_CEREAIS,
  'AVEIA': CategoriaAlimento.GRAOS_CEREAIS,
  'AVEIA EM FLOCOS': CategoriaAlimento.GRAOS_CEREAIS,
  'QUINOA': CategoriaAlimento.GRAOS_CEREAIS,
  'LENTILHA': CategoriaAlimento.GRAOS_CEREAIS,
  'GRÃO DE BICO': CategoriaAlimento.GRAOS_CEREAIS,
  'ERVILHA': CategoriaAlimento.GRAOS_CEREAIS,
  'ERVILHA SECA': CategoriaAlimento.GRAOS_CEREAIS,
  'AMENDOIM': CategoriaAlimento.GRAOS_CEREAIS,
  'CASTANHA': CategoriaAlimento.GRAOS_CEREAIS,
  'CASTANHA DO PARÁ': CategoriaAlimento.GRAOS_CEREAIS,
  'CASTANHA DE CAJU': CategoriaAlimento.GRAOS_CEREAIS,
  'NOZES': CategoriaAlimento.GRAOS_CEREAIS,
  'AMÊNDOAS': CategoriaAlimento.GRAOS_CEREAIS,
  'PISTACHE': CategoriaAlimento.GRAOS_CEREAIS,
  'AVELÃ': CategoriaAlimento.GRAOS_CEREAIS,
  'LINHAÇA': CategoriaAlimento.GRAOS_CEREAIS,
  'CHIA': CategoriaAlimento.GRAOS_CEREAIS,
  'GERGELIM': CategoriaAlimento.GRAOS_CEREAIS,
  'GIRASSOL': CategoriaAlimento.GRAOS_CEREAIS,
  'SEMENTE DE ABÓBORA': CategoriaAlimento.GRAOS_CEREAIS,
  'GRANOLA': CategoriaAlimento.GRAOS_CEREAIS,
  'CENTEIO': CategoriaAlimento.GRAOS_CEREAIS,
  'CEVADA': CategoriaAlimento.GRAOS_CEREAIS,
  'TRIGO': CategoriaAlimento.GRAOS_CEREAIS,
  
  // ===== LATICÍNIOS =====
  'LEITE': CategoriaAlimento.LATICINIOS,
  'LEITE INTEGRAL': CategoriaAlimento.LATICINIOS,
  'LEITE DESNATADO': CategoriaAlimento.LATICINIOS,
  'LEITE SEMI-DESNATADO': CategoriaAlimento.LATICINIOS,
  'QUEIJO': CategoriaAlimento.LATICINIOS,
  'QUEIJO MUSSARELA': CategoriaAlimento.LATICINIOS,
  'QUEIJO PRATO': CategoriaAlimento.LATICINIOS,
  'QUEIJO COALHO': CategoriaAlimento.LATICINIOS,
  'QUEIJO MINAS': CategoriaAlimento.LATICINIOS,
  'QUEIJO RICOTA': CategoriaAlimento.LATICINIOS,
  'REQUEIJÃO': CategoriaAlimento.LATICINIOS,
  'CREAM CHEESE': CategoriaAlimento.LATICINIOS,
  'IOGURTE': CategoriaAlimento.LATICINIOS,
  'IOGURTE NATURAL': CategoriaAlimento.LATICINIOS,
  'IOGURTE GREGO': CategoriaAlimento.LATICINIOS,
  'MANTEIGA': CategoriaAlimento.LATICINIOS,
  'MARGARINA': CategoriaAlimento.LATICINIOS,
  'NATA': CategoriaAlimento.LATICINIOS,
  'CREME DE LEITE': CategoriaAlimento.LATICINIOS,
  'LEITE CONDENSADO': CategoriaAlimento.LATICINIOS,
  
  // ===== BEBIDAS =====
  'ÁGUA': CategoriaAlimento.BEBIDAS,
  'ÁGUA MINERAL': CategoriaAlimento.BEBIDAS,
  'ÁGUA COM GÁS': CategoriaAlimento.BEBIDAS,
  'REFRIGERANTE': CategoriaAlimento.BEBIDAS,
  'COCA-COLA': CategoriaAlimento.BEBIDAS,
  'GUARANÁ': CategoriaAlimento.BEBIDAS,
  'FANTA': CategoriaAlimento.BEBIDAS,
  'SPRITE': CategoriaAlimento.BEBIDAS,
  'SUCO': CategoriaAlimento.BEBIDAS,
  'SUCO DE LARANJA': CategoriaAlimento.BEBIDAS,
  'SUCO DE UVA': CategoriaAlimento.BEBIDAS,
  'SUCO DE MAÇÃ': CategoriaAlimento.BEBIDAS,
  'SUCO NATURAL': CategoriaAlimento.BEBIDAS,
  'SUCO CONCENTRADO': CategoriaAlimento.BEBIDAS,
  'VITAMINA': CategoriaAlimento.BEBIDAS,
  'SMOOTHIE': CategoriaAlimento.BEBIDAS,
  'CHÁ': CategoriaAlimento.BEBIDAS,
  'CHÁ PRETO': CategoriaAlimento.BEBIDAS,
  'CHÁ VERDE': CategoriaAlimento.BEBIDAS,
  'CHÁ DE CAMOMILA': CategoriaAlimento.BEBIDAS,
  'CERVEJA': CategoriaAlimento.BEBIDAS,
  'VINHO': CategoriaAlimento.BEBIDAS,
  'CACHAÇA': CategoriaAlimento.BEBIDAS,
  'VODKA': CategoriaAlimento.BEBIDAS,
  'WHISKY': CategoriaAlimento.BEBIDAS,
  'ENERGÉTICO': CategoriaAlimento.BEBIDAS,
  'ISOTÔNICO': CategoriaAlimento.BEBIDAS,
  'ÁGUA DE COCO': CategoriaAlimento.BEBIDAS,
  
  // ===== PANIFICAÇÃO =====
  'BISCOITO': CategoriaAlimento.PANIFICACAO,
  'BISCOITO DOCE': CategoriaAlimento.PANIFICACAO,
  'BOLACHA': CategoriaAlimento.PANIFICACAO,
  'BOLACHA MARIA': CategoriaAlimento.PANIFICACAO,
  'BOLACHA MAISENA': CategoriaAlimento.PANIFICACAO,
  'COOKIE': CategoriaAlimento.PANIFICACAO,
  'PÃO': CategoriaAlimento.PANIFICACAO,
  'PÃO FRANCÊS': CategoriaAlimento.PANIFICACAO,
  'PÃO DE FORMA': CategoriaAlimento.PANIFICACAO,
  'PÃO INTEGRAL': CategoriaAlimento.PANIFICACAO,
  'PÃO DOCE': CategoriaAlimento.PANIFICACAO,
  'PÃO DE AÇÚCAR': CategoriaAlimento.PANIFICACAO,
  'BRIOCHE': CategoriaAlimento.PANIFICACAO,
  'CROISSANT': CategoriaAlimento.PANIFICACAO,
  'BOLO': CategoriaAlimento.PANIFICACAO,
  'BOLO DE CHOCOLATE': CategoriaAlimento.PANIFICACAO,
  'BOLO DE FUBÁ': CategoriaAlimento.PANIFICACAO,
  'CUPCAKE': CategoriaAlimento.PANIFICACAO,
  'MUFFIN': CategoriaAlimento.PANIFICACAO,
  'TORTA': CategoriaAlimento.PANIFICACAO,
  'PIZZA': CategoriaAlimento.PANIFICACAO,
  'MASSA DE PIZZA': CategoriaAlimento.PANIFICACAO,
  'TORRADA': CategoriaAlimento.PANIFICACAO,
  'WAFER': CategoriaAlimento.PANIFICACAO,
  'CASQUINHA': CategoriaAlimento.PANIFICACAO,
  
  // ===== CONDIMENTOS E TEMPEROS =====
  'TEMPERO': CategoriaAlimento.CONDIMENTOS,
  'TEMPERO PRONTO': CategoriaAlimento.CONDIMENTOS,
  'CALDO DE GALINHA': CategoriaAlimento.CONDIMENTOS,
  'CALDO DE CARNE': CategoriaAlimento.CONDIMENTOS,
  'PIMENTA': CategoriaAlimento.CONDIMENTOS,
  'PIMENTA DO REINO': CategoriaAlimento.CONDIMENTOS,
  'PIMENTA MALAGUETA': CategoriaAlimento.CONDIMENTOS,
  'PIMENTA CALABRESA': CategoriaAlimento.CONDIMENTOS,
  'COMINHO': CategoriaAlimento.CONDIMENTOS,
  'ORÉGANO': CategoriaAlimento.CONDIMENTOS,
  'MANJERICÃO SECO': CategoriaAlimento.CONDIMENTOS,
  'TOMILHO': CategoriaAlimento.CONDIMENTOS,
  'ALECRIM': CategoriaAlimento.CONDIMENTOS,
  'LOURO': CategoriaAlimento.CONDIMENTOS,
  'CANELA': CategoriaAlimento.CONDIMENTOS,
  'CRAVO': CategoriaAlimento.CONDIMENTOS,
  'NOZ MOSCADA': CategoriaAlimento.CONDIMENTOS,
  'AÇAFRÃO': CategoriaAlimento.CONDIMENTOS,
  'CÚRCUMA': CategoriaAlimento.CONDIMENTOS,
  'PÁPRICA': CategoriaAlimento.CONDIMENTOS,
  'CURRY': CategoriaAlimento.CONDIMENTOS,
  'MOSTARDA': CategoriaAlimento.CONDIMENTOS,
  'KETCHUP': CategoriaAlimento.CONDIMENTOS,
  'MAIONESE': CategoriaAlimento.CONDIMENTOS,
  'MOLHO DE TOMATE': CategoriaAlimento.CONDIMENTOS,
  'MOLHO BARBECUE': CategoriaAlimento.CONDIMENTOS,
  'MOLHO INGLÊS': CategoriaAlimento.CONDIMENTOS,
  'SHOYU': CategoriaAlimento.CONDIMENTOS,
  'MOLHO DE SOJA': CategoriaAlimento.CONDIMENTOS,
  'AZEITE': CategoriaAlimento.CONDIMENTOS,
  'AZEITE DE OLIVA': CategoriaAlimento.CONDIMENTOS,
  'VINAGRE BALSÂMICO': CategoriaAlimento.CONDIMENTOS,
  'VINAGRE DE MAÇÃ': CategoriaAlimento.CONDIMENTOS,
  
  // ===== DOCES E SOBREMESAS =====
  'CHOCOLATE': CategoriaAlimento.DOCES_SOBREMESAS,
  'CHOCOLATE AO LEITE': CategoriaAlimento.DOCES_SOBREMESAS,
  'CHOCOLATE MEIO AMARGO': CategoriaAlimento.DOCES_SOBREMESAS,
  'CHOCOLATE BRANCO': CategoriaAlimento.DOCES_SOBREMESAS,
  'BOMBOM': CategoriaAlimento.DOCES_SOBREMESAS,
  'TRUFA': CategoriaAlimento.DOCES_SOBREMESAS,
  'BRIGADEIRO': CategoriaAlimento.DOCES_SOBREMESAS,
  'BEIJINHO': CategoriaAlimento.DOCES_SOBREMESAS,
  'PUDIM': CategoriaAlimento.DOCES_SOBREMESAS,
  'GELATINA': CategoriaAlimento.DOCES_SOBREMESAS,
  'SORVETE': CategoriaAlimento.DOCES_SOBREMESAS,
  'AÇAÍ': CategoriaAlimento.DOCES_SOBREMESAS,
  'PICOLÉ': CategoriaAlimento.DOCES_SOBREMESAS,
  'BALA': CategoriaAlimento.DOCES_SOBREMESAS,
  'CHICLETE': CategoriaAlimento.DOCES_SOBREMESAS,
  'PIRULITO': CategoriaAlimento.DOCES_SOBREMESAS,
  'DOCE DE LEITE': CategoriaAlimento.DOCES_SOBREMESAS,
  'GOIABADA': CategoriaAlimento.DOCES_SOBREMESAS,
  'MARMELADA': CategoriaAlimento.DOCES_SOBREMESAS,
  'COMPOTA': CategoriaAlimento.DOCES_SOBREMESAS,
  'GELEIA': CategoriaAlimento.DOCES_SOBREMESAS,
  'MEL': CategoriaAlimento.DOCES_SOBREMESAS,
  'MELADO': CategoriaAlimento.DOCES_SOBREMESAS,
  'RAPADURA': CategoriaAlimento.DOCES_SOBREMESAS,
  'PAÇOCA': CategoriaAlimento.DOCES_SOBREMESAS,
  'PÉ DE MOLEQUE': CategoriaAlimento.DOCES_SOBREMESAS,
  'COCADA': CategoriaAlimento.DOCES_SOBREMESAS,
  'QUINDIM': CategoriaAlimento.DOCES_SOBREMESAS,
  'MOUSSE': CategoriaAlimento.DOCES_SOBREMESAS,
  
  // ===== CONSERVAS E ENLATADOS =====
  'MILHO ENLATADO': CategoriaAlimento.CONSERVAS,
  'ERVILHA ENLATADA': CategoriaAlimento.CONSERVAS,
  'AZEITONA': CategoriaAlimento.CONSERVAS,
  'PEPINO EM CONSERVA': CategoriaAlimento.CONSERVAS,
  'PALMITO': CategoriaAlimento.CONSERVAS,
  'ATUM ENLATADO': CategoriaAlimento.CONSERVAS,
  'SARDINHA ENLATADA': CategoriaAlimento.CONSERVAS,
  'SALSICHA ENLATADA': CategoriaAlimento.CONSERVAS,
  'MOLHO DE TOMATE ENLATADO': CategoriaAlimento.CONSERVAS,
  'TOMATE PELADO': CategoriaAlimento.CONSERVAS,
  'EXTRATO DE TOMATE': CategoriaAlimento.CONSERVAS,
  'PATÊ': CategoriaAlimento.CONSERVAS,
  'CONSERVA': CategoriaAlimento.CONSERVAS,
  'PICLES': CategoriaAlimento.CONSERVAS,
  
  // ===== CONGELADOS =====
  'BATATA FRITA CONGELADA': CategoriaAlimento.CONGELADOS,
  'HAMBÚRGUER CONGELADO': CategoriaAlimento.CONGELADOS,
  'NUGGETS': CategoriaAlimento.CONGELADOS,
  'EMPANADO': CategoriaAlimento.CONGELADOS,
  'PIZZA CONGELADA': CategoriaAlimento.CONGELADOS,
  'LASANHA CONGELADA': CategoriaAlimento.CONGELADOS,
  'VERDURA CONGELADA': CategoriaAlimento.CONGELADOS,
  'FRUTA CONGELADA': CategoriaAlimento.CONGELADOS,
  'POLPA DE FRUTA': CategoriaAlimento.CONGELADOS,
  'AÇAÍ CONGELADO': CategoriaAlimento.CONGELADOS,
  'PEIXE CONGELADO': CategoriaAlimento.CONGELADOS,
  'CAMARÃO CONGELADO': CategoriaAlimento.CONGELADOS,
  'FRANGO CONGELADO': CategoriaAlimento.CONGELADOS,
  'CARNE CONGELADA': CategoriaAlimento.CONGELADOS
};

// Lista de alimentos líquidos que devem ter unidade 'l' ao invés de 'g'
const ALIMENTOS_LIQUIDOS = [
  'ÁGUA', 'ÁGUA MINERAL', 'ÁGUA COM GÁS', 'ÁGUA DE COCO',
  'LEITE', 'LEITE INTEGRAL', 'LEITE DESNATADO', 'LEITE SEMI-DESNATADO',
  'REFRIGERANTE', 'COCA-COLA', 'GUARANÁ', 'FANTA', 'SPRITE',
  'SUCO', 'SUCO DE LARANJA', 'SUCO DE UVA', 'SUCO DE MAÇÃ', 'SUCO NATURAL', 'SUCO CONCENTRADO',
  'VITAMINA', 'SMOOTHIE',
  'CHÁ', 'CHÁ PRETO', 'CHÁ VERDE', 'CHÁ DE CAMOMILA',
  'CERVEJA', 'VINHO', 'CACHAÇA', 'VODKA', 'WHISKY',
  'ENERGÉTICO', 'ISOTÔNICO',
  'ÓLEO', 'ÓLEO DE SOJA', 'ÓLEO DE MILHO', 'ÓLEO DE GIRASSOL',
  'AZEITE', 'AZEITE DE OLIVA',
  'VINAGRE', 'VINAGRE BALSÂMICO', 'VINAGRE DE MAÇÃ',
  'MOLHO DE TOMATE', 'MOLHO BARBECUE', 'MOLHO INGLÊS', 'SHOYU', 'MOLHO DE SOJA',
  'CREME DE LEITE', 'NATA'
];

function determinarCategoriaAutomatica(nomeAlimento) {
  const nomeNormalizado = nomeAlimento.toUpperCase().trim();

  // Busca correspondência exata primeiro
  if (MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado]) {
    return MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado];
  }

  // Busca por palavras-chave no nome
  for (const [palavra, categoria] of Object.entries(MAPEAMENTO_CATEGORIA_AUTOMATICO)) {
    if (nomeNormalizado.includes(palavra)) {
      return categoria;
    }
  }

  // Padrões específicos expandidos
  if (/CARNE|FRANGO|PEIXE|OVO|LINGUIÇA|PRESUNTO|MORTADELA|SALSICHA|CAMARÃO|BACON|PERU/i.test(nomeNormalizado)) {
    return CategoriaAlimento.PROTEINAS;
  }
  
  if (/LEITE|QUEIJO|IOGURTE|MANTEIGA|MARGARINA|NATA|REQUEIJÃO|RICOTA|CREAM/i.test(nomeNormalizado)) {
    return CategoriaAlimento.LATICINIOS;
  }
  
  if (/SUCO|ÁGUA|REFRIGERANTE|CERVEJA|VINHO|CHÁ|CAFÉ|ENERGÉTICO|ISOTÔNICO/i.test(nomeNormalizado)) {
    return CategoriaAlimento.BEBIDAS;
  }
  
  if (/PÃO|BOLO|BISCOITO|BOLACHA|COOKIE|TORTA|PIZZA|CROISSANT|BRIOCHE|MUFFIN/i.test(nomeNormalizado)) {
    return CategoriaAlimento.PANIFICACAO;
  }
  
  if (/DOCE|CHOCOLATE|AÇÚCAR|MEL|SORVETE|PUDIM|BALA|BOMBOM|BRIGADEIRO|TRUFA|PAÇOCA|COCADA/i.test(nomeNormalizado)) {
    return CategoriaAlimento.DOCES_SOBREMESAS;
  }
  
  if (/TEMPERO|PIMENTA|ORÉGANO|COMINHO|CANELA|CRAVO|MOSTARDA|KETCHUP|MAIONESE|MOLHO|AZEITE/i.test(nomeNormalizado)) {
    return CategoriaAlimento.CONDIMENTOS;
  }
  
  if (/ENLATADO|CONSERVA|AZEITONA|PALMITO|ATUM|PICLES|PATÊ/i.test(nomeNormalizado)) {
    return CategoriaAlimento.CONSERVAS;
  }
  
  if (/CONGELADO|NUGGETS|EMPANADO|POLPA/i.test(nomeNormalizado)) {
    return CategoriaAlimento.CONGELADOS;
  }
  
  if (/CASTANHA|AMENDOIM|NOZES|AMÊNDOA|LINHAÇA|CHIA|GRANOLA|AVEIA|QUINOA|LENTILHA|GRÃO/i.test(nomeNormalizado)) {
    return CategoriaAlimento.GRAOS_CEREAIS;
  }

  return CategoriaAlimento.OUTROS;
}

function determinarUnidadeMedida(nomeAlimento, unidadeAtual) {
  const nomeNormalizado = nomeAlimento.toUpperCase().trim();
  
  // Se já está em litros, manter
  if (unidadeAtual === 'l' || unidadeAtual === 'ml') {
    return unidadeAtual;
  }
  
  // Verificar se é um alimento líquido
  const ehLiquido = ALIMENTOS_LIQUIDOS.some(liquido => 
    nomeNormalizado === liquido || nomeNormalizado.includes(liquido)
  );
  
  if (ehLiquido) {
    return 'l';
  }
  
  // Verificar padrões para líquidos
  if (/ÁGUA|LEITE|SUCO|REFRIGERANTE|CERVEJA|VINHO|CHÁ|ÓLEO|AZEITE|VINAGRE|MOLHO LÍQUIDO/i.test(nomeNormalizado)) {
    return 'l';
  }
  
  // Manter a unidade atual se não for líquido
  return unidadeAtual || 'g';
}

async function verificarCategorias() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  try {
    console.log('🔍 Verificando situação atual das categorias...\n');
    
    const conteudoAtual = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos = JSON.parse(conteudoAtual);
    
    let comCategoria = 0;
    let semCategoria = 0;
    let unidadeIncorreta = 0;
    const distribuicao = {};
    const semCategoriaList = [];
    const unidadeIncorretaList = [];
    
    alimentos.forEach((alimento) => {
      if (alimento.categoria && Object.values(CategoriaAlimento).includes(alimento.categoria)) {
        comCategoria++;
        distribuicao[alimento.categoria] = (distribuicao[alimento.categoria] || 0) + 1;
      } else {
        semCategoria++;
        semCategoriaList.push({
          nome: alimento.nome,
          categoriasugerida: determinarCategoriaAutomatica(alimento.nome)
        });
      }
      
      // Verificar unidade de medida
      const unidadeCorreta = determinarUnidadeMedida(alimento.nome, alimento.unidade_medida);
      if (alimento.unidade_medida !== unidadeCorreta) {
        unidadeIncorreta++;
        unidadeIncorretaList.push({
          nome: alimento.nome,
          unidadeAtual: alimento.unidade_medida || 'não definida',
          unidadeSugerida: unidadeCorreta
        });
      }
    });
    
    console.log(`📊 Estatísticas atuais:`);
    console.log(`   - Total: ${alimentos.length} alimentos`);
    console.log(`   - Com categoria: ${comCategoria}`);
    console.log(`   - Sem categoria: ${semCategoria}`);
    console.log(`   - Com unidade incorreta: ${unidadeIncorreta}`);
    
    if (Object.keys(distribuicao).length > 0) {
      console.log('\n📈 Distribuição atual por categoria:');
      Object.entries(distribuicao)
        .sort(([,a], [,b]) => b - a)
        .forEach(([categoria, count]) => {
          console.log(`   ${categoria}: ${count} alimentos`);
        });
    }
    
    if (semCategoriaList.length > 0) {
      console.log('\n❌ Alimentos sem categoria (primeiros 10):');
      semCategoriaList.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nome} → (sugere: ${item.categoriasugerida})`);
      });
      
      if (semCategoriaList.length > 10) {
        console.log(`   ... e mais ${semCategoriaList.length - 10} alimentos`);
      }
    }
    
    if (unidadeIncorretaList.length > 0) {
      console.log('\n⚠️ Alimentos com unidade incorreta (primeiros 10):');
      unidadeIncorretaList.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nome}: ${item.unidadeAtual} → ${item.unidadeSugerida}`);
      });
      
      if (unidadeIncorretaList.length > 10) {
        console.log(`   ... e mais ${unidadeIncorretaList.length - 10} alimentos`);
      }
    }
    
    console.log(`\n💡 ${(semCategoria > 0 || unidadeIncorreta > 0) ? 'Execute "npm run migrate:categorias" para aplicar as correções automaticamente.' : 'Todos os alimentos já estão categorizados e com unidades corretas!'}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar categorias:', error);
    process.exit(1);
  }
}

async function migrarCategorias() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  try {
    console.log('🔄 Iniciando migração de categorias e unidades...\n');
    
    // Ler arquivo atual
    const conteudoAtual = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos = JSON.parse(conteudoAtual);
    
    console.log(`📊 Total de alimentos encontrados: ${alimentos.length}`);
    
    let alimentosAtualizados = 0;
    let alimentosJaCategorizado = 0;
    let unidadesCorrigidas = 0;
    const distribuicao = {};
    
    // Processar cada alimento
    const alimentosMigrados = alimentos.map((alimento) => {
      
      let categoria;
      let alterouCategoria = false;
      let alterouUnidade = false;
      
      // Verificar se já tem categoria válida
      if (alimento.categoria && Object.values(CategoriaAlimento).includes(alimento.categoria)) {
        console.log(`   ✅ Já categorizado como: ${alimento.categoria}`);
        alimentosJaCategorizado++;
        categoria = alimento.categoria;
      } else {
        // Determinar categoria automaticamente
        categoria = determinarCategoriaAutomatica(alimento.nome);
        console.log(`   🔍 Categoria determinada: ${categoria}`);
        alimentosAtualizados++;
        alterouCategoria = true;
      }
      
      // Verificar e corrigir unidade de medida
      const unidadeCorreta = determinarUnidadeMedida(alimento.nome, alimento.unidade_medida);
      const unidadeAtual = alimento.unidade_medida || 'g';
      
      if (unidadeAtual !== unidadeCorreta) {
        console.log(`   🔧 Unidade corrigida: ${unidadeAtual} → ${unidadeCorreta}`);
        unidadesCorrigidas++;
        alterouUnidade = true;
      }
      
      distribuicao[categoria] = (distribuicao[categoria] || 0) + 1;
      
      const resultado = {
        ...alimento,
        categoria: categoria,
        unidade_medida: unidadeCorreta,
        // Garantir que restricoesAlimentares exista
        restricoesAlimentares: alimento.restricoesAlimentares || []
      };
      
      if (alterouCategoria || alterouUnidade) {
        console.log(`   ✨ Alimento atualizado!`);
      }
      
      return resultado;
    });
    
    // Criar backup do arquivo original
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = `${alimentosPath}.backup.${timestamp}`;
    await fs.copyFile(alimentosPath, backupPath);
    console.log(`\n💾 Backup criado em: ${backupPath}`);
    
    // Salvar arquivo atualizado
    await fs.writeFile(alimentosPath, JSON.stringify(alimentosMigrados, null, 2), 'utf-8');
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de alimentos: ${alimentos.length}`);
    console.log(`   - Já categorizados: ${alimentosJaCategorizado}`);
    console.log(`   - Categorias atualizadas: ${alimentosAtualizados}`);
    console.log(`   - Unidades corrigidas: ${unidadesCorrigidas}`);
    
    // Mostrar distribuição por categoria
    console.log('\n📈 Distribuição final por categoria:');
    Object.entries(distribuicao)
      .sort(([,a], [,b]) => b - a)
      .forEach(([categoria, count]) => {
        console.log(`   ${categoria}: ${count} alimentos`);
      });
    
    console.log('\n🎉 Migração concluída! Todos os alimentos têm categoria definida e unidades corretas.');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar baseado no argumento
const comando = process.argv[2];

if (comando === 'verificar') {
  verificarCategorias();
} else if (comando === 'migrar') {
  migrarCategorias();
} else {
  console.log('📋 Comandos disponíveis:');
  console.log('   node scripts/migrate-categorias.js verificar  - Verifica situação atual');
  console.log('   node scripts/migrate-categorias.js migrar     - Executa a migração');
  console.log('\n💡 Recomendação: Execute "verificar" primeiro para ver o que será alterado');
  console.log('✨ Agora com correção automática de unidades de medida para líquidos!');
}