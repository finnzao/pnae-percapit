import json
import re

ARQUIVO_ENTRADA = 'alimentos_antigo.json'
ARQUIVO_SAIDA = 'alimentos_novo.json'


def parse_fator(valor):
    if not valor or str(valor).strip() in ['-', '']:
        return "1"
    try:
        return str(float(valor).replace(',', '.'))
    except Exception:
        return "1"


def parse_per_capita(valor_texto):
    if not valor_texto or valor_texto.strip() in ['', '-']:
        return {"status": "indisponivel"}

    texto = valor_texto.strip().lower()

    if texto == 'x':
        return {"status": "indisponivel"}

    if texto == '*':
        return {"status": "Depende da preparação da receita"}

    match = re.search(r'([\d,.]+)', texto)
    if not match:
        return {"status": "indisponivel"}

    try:
        valor = float(match.group(1).replace(',', '.'))
        return {"status": "disponivel", "valor": valor}
    except ValueError:
        return {"status": "indisponivel"}


def converter(alimento):
    per_capita = {
        "creche": parse_per_capita(alimento.get("creche", "")),
        "pre": parse_per_capita(alimento.get("pre_escola", "")),
        "fundamental": parse_per_capita(alimento.get("fundamental", "")),
        "medio": parse_per_capita(alimento.get("medio_eja", "")),
    }

    return {
        "nome": alimento["alimento"],
        "fc": parse_fator(alimento.get("fator_correcao", "")),
        "fcc": parse_fator(alimento.get("fator_coccao", "")),
        "perCapita": per_capita,
        "limitada_menor3": alimento.get("creche", "").strip().lower() == 'x',
        "limitada_todas": str(alimento.get("limitada_todas", "")).strip().lower() == 'sim'
    }


def main():
    with open(ARQUIVO_ENTRADA, encoding='utf-8') as f:
        dados = json.load(f)

    if "alimentos" not in dados or not isinstance(dados["alimentos"], list):
        raise ValueError("Arquivo JSON não contém uma lista válida em 'alimentos'.")

    alimentos_convertidos = [converter(alimento) for alimento in dados["alimentos"]]

    with open(ARQUIVO_SAIDA, 'w', encoding='utf-8') as f:
        json.dump({"alimentos": alimentos_convertidos}, f, ensure_ascii=False, indent=2)

    print(f"Arquivo salvo com sucesso em {ARQUIVO_SAIDA}")


if __name__ == "__main__":
    main()
