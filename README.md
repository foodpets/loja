# 🐾 Food Pets — Loja Virtual

Loja de alimentação natural para cães e gatos. Site 100% estático hospedado no **GitHub Pages**, com carrinho de compras e finalização de pedidos via **WhatsApp**.

## 🌐 Endereço da loja

**https://foodpets.github.io/loja/**

## 📁 Estrutura

```
├── index.html          # Página principal
├── css/style.css       # Estilos
├── js/products.js      # ⭐ CONFIGURAÇÃO DA LOJA E PRODUTOS
├── js/app.js           # Lógica (carrinho, filtros, WhatsApp)
└── img/                # Imagens (WebP otimizado) + logo
```

## 🛠️ Como editar os produtos

Todo o catálogo fica no arquivo `js/products.js`. Para alterar preços, nomes ou descrições, basta editar esse arquivo e fazer commit — o site atualiza automaticamente.

Exemplo de produto:

```js
{
  id: 'natural-picadinho',          // identificador único
  name: 'Food Pets Natural Picadinho 300g',
  line: 'Clássica',                 // linha (aparece como selo no card)
  category: 'refeicoes',            // refeicoes | desidratados | biscoitos
  price: 20.90,                     // preço em reais
  weight: '300g',
  img: 'img/refeicao-picadinho.webp',
  tags: ['caes'],                   // caes | gatos | filhotes
  desc: 'Descrição do produto...',
}
```

Para adicionar um novo produto: copie um bloco, altere os dados, coloque a imagem na pasta `img/` e pronto.

## 📱 Como funciona o pedido

1. O cliente adiciona produtos ao carrinho no site;
2. Preenche nome, entrega/retirada e endereço;
3. Clica em **"Finalizar pedido no WhatsApp"**;
4. O pedido completo (itens, quantidades, total e dados do cliente) é enviado automaticamente para o WhatsApp da loja.

## ⚙️ Configurações da loja

No topo de `js/products.js` fica o objeto `STORE_CONFIG`:

```js
const STORE_CONFIG = {
  name: 'Food Pets',
  whatsapp: '5516991330338',   // número que recebe os pedidos
  whatsappLabel: '(16) 99133-0338',
};
```

## 🚀 Publicação

O site é publicado automaticamente pelo GitHub Pages a cada push na branch `main`.
