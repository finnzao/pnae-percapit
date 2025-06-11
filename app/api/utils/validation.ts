export function validarFloatPositivo(input: string): number | '' {
    const regex = /^[0-9]+([.,][0-9]+)?$/;

    if (!regex.test(input)) return '';

    const valorNormalizado = input.replace(',', '.');
    const numero = parseFloat(valorNormalizado);

    return numero > 0 ? numero : '';
}



export function validarInteiroPositivo(valor: string, anterior: string): number | string {
  const apenasDigitos = /^[0-9]*$/; // permite string vazia para facilitar digitação

  if (!apenasDigitos.test(valor)) {
    return anterior; // mantém o valor anterior se entrada for inválida
  }

  const numero = Number(valor);
  return numero > 0 ? numero : '';
}