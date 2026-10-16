/* ============================================================
   FOOD PETS — Lógica da loja
   Catálogo, carrinho (localStorage), filtros, busca e
   finalização do pedido via WhatsApp.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (sel) => document.querySelector(sel);
  const money = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

  /* ---------- Estado ---------- */
  let currentCategory = 'todos';
  let currentSearch = '';
  let cart = [];
  let modalProduct = null;
  let modalQty = 1;

  try {
    cart = JSON.parse(localStorage.getItem('foodpets_cart') || '[]');
  } catch (e) { cart = []; }

  const saveCart = () => {
    try { localStorage.setItem('foodpets_cart', JSON.stringify(cart)); } catch (e) {}
  };

  /* ---------- Ícones ---------- */
  const ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6"/></svg>';
  const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  const TAG_LABELS = {
    caes: '🐕 Cães',
    gatos: '🐈 Gatos',
    filhotes: '🐣 Filhotes',
  };

  /* ============================================================
     RENDERIZAÇÃO DO CATÁLOGO
     ============================================================ */
  const grid = $('#productsGrid');
  const filtersEl = $('#filters');

  function renderFilters() {
    filtersEl.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'chip' + (cat.id === currentCategory ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.textContent = cat.icon + '  ' + cat.label;
      btn.addEventListener('click', () => {
        currentCategory = cat.id;
        renderFilters();
        renderProducts();
      });
      filtersEl.appendChild(btn);
    });
  }

  function matchesProduct(p) {
    const inCategory = currentCategory === 'todos' || p.category === currentCategory;
    if (!inCategory) return false;
    if (!currentSearch) return true;
    const q = currentSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.line.toLowerCase().includes(q) ||
      p.tags.some((t) => TAG_LABELS[t]?.toLowerCase().includes(q))
    );
  }

  function renderProducts() {
    const list = PRODUCTS.filter(matchesProduct);
    grid.innerHTML = '';

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="big">🔍</div>
          <h3>Nenhum produto encontrado</h3>
          <p style="margin-top:.4rem">Tente buscar por outro nome, como "frango" ou "biscoito".</p>
        </div>`;
      return;
    }

    list.forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.style.animationDelay = Math.min(i * 45, 400) + 'ms';
      card.innerHTML = `
        <div class="product-media" role="button" tabindex="0" aria-label="Ver detalhes de ${p.name}">
          <span class="line-badge ${p.line.toLowerCase()}">${p.line}</span>
          <img src="${p.img}" alt="${p.name}" loading="lazy">
        </div>
        <div class="product-body">
          <h3 class="product-name" role="button" tabindex="0">${p.name}</h3>
          <span class="product-weight">${p.weight}</span>
          <div class="product-foot">
            <div class="price">${money(p.price)} <small>/un.</small></div>
            <button class="add-btn" aria-label="Adicionar ${p.name} ao carrinho">${ICON_PLUS}</button>
          </div>
        </div>`;

      card.querySelector('.product-media').addEventListener('click', () => openModal(p));
      card.querySelector('.product-media').addEventListener('keydown', (e) => { if (e.key === 'Enter') openModal(p); });
      card.querySelector('.product-name').addEventListener('click', () => openModal(p));
      card.querySelector('.product-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') openModal(p); });
      card.querySelector('.add-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(p.id, 1);
        toast('✅ ' + p.name.split(' 3')[0] + ' adicionado ao carrinho!');
      });

      grid.appendChild(card);
    });
  }

  /* ============================================================
     MODAL DE PRODUTO
     ============================================================ */
  const modalEl = $('#productModal');

  function openModal(p) {
    modalProduct = p;
    modalQty = 1;
    $('#modalImg').src = p.img;
    $('#modalImg').alt = p.name;
    $('#modalLine').textContent = 'Linha ' + p.line + ' • ' + p.weight;
    $('#modalName').textContent = p.name;
    $('#modalPrice').textContent = money(p.price);
    $('#modalDesc').textContent = p.desc;
    $('#modalTags').innerHTML = (p.tags || [])
      .map((t) => `<span class="tag-pill">${TAG_LABELS[t] || t}</span>`)
      .join('');
    $('#qtyVal').textContent = '1';
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $('#modalClose').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
  $('#qtyMinus').addEventListener('click', () => {
    if (modalQty > 1) { modalQty--; $('#qtyVal').textContent = modalQty; }
  });
  $('#qtyPlus').addEventListener('click', () => {
    if (modalQty < 99) { modalQty++; $('#qtyVal').textContent = modalQty; }
  });
  $('#modalAdd').addEventListener('click', () => {
    if (!modalProduct) return;
    addToCart(modalProduct.id, modalQty);
    toast(`✅ ${modalQty}x ${modalProduct.name.split(' 3')[0]} no carrinho!`);
    closeModal();
  });

  /* ============================================================
     CARRINHO
     ============================================================ */
  const cartDrawer = $('#cartDrawer');
  const cartOverlay = $('#cartOverlay');
  const cartItemsEl = $('#cartItems');

  function addToCart(id, qty) {
    const item = cart.find((i) => i.id === id);
    if (item) {
      item.qty = Math.min(item.qty + qty, 99);
    } else {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return;
      cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, weight: p.weight, qty });
    }
    saveCart();
    renderCart();
    bumpBadge();
  }

  function changeQty(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const badge = $('#cartCount');
    badge.textContent = count;
    badge.hidden = count === 0;

    if (!cart.length) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="big">🛒</div>
          <p>Seu carrinho está vazio.<br>Que tal uma refeição natural fresquinha?</p>
          <button class="btn btn-primary" id="emptyGoShop">Ver produtos 🐾</button>
        </div>`;
      $('#emptyGoShop').addEventListener('click', () => {
        closeCart();
        document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      cartItemsEl.innerHTML = '';
      cart.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <img src="${item.img}" alt="${item.name}">
          <div class="ci-info">
            <div class="ci-name">${item.name}</div>
            <div class="ci-price">${money(item.price)} <small style="color:var(--text-mute)">/un.</small></div>
          </div>
          <div class="ci-actions">
            <div class="ci-qty">
              <button aria-label="Diminuir">−</button>
              <span>${item.qty}</span>
              <button aria-label="Aumentar">+</button>
            </div>
            <button class="ci-remove">remover</button>
          </div>`;
        const [minus, plus] = el.querySelectorAll('.ci-qty button');
        minus.addEventListener('click', () => changeQty(item.id, -1));
        plus.addEventListener('click', () => changeQty(item.id, 1));
        el.querySelector('.ci-remove').addEventListener('click', () => removeItem(item.id));
        cartItemsEl.appendChild(el);
      });
    }

    $('#cartTotal').textContent = money(cartTotal());
    updateCheckoutBtn();
  }

  function bumpBadge() {
    const badge = $('#cartCount');
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 220);
  }

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('#cartOpenBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* ============================================================
     CHECKOUT VIA WHATSAPP
     ============================================================ */
  const deliverySelect = $('#custDelivery');
  const addressField = $('#addressField');

  deliverySelect.addEventListener('change', () => {
    const isDelivery = deliverySelect.value === 'Entrega';
    addressField.style.display = isDelivery ? '' : 'none';
    const addrInput = $('#custAddress');
    addrInput.required = isDelivery;
    updateCheckoutBtn();
  });

  function formValid() {
    const name = $('#custName').value.trim();
    if (!name) return false;
    if (deliverySelect.value === 'Entrega' && !$('#custAddress').value.trim()) return false;
    return cart.length > 0;
  }

  function updateCheckoutBtn() {
    $('#checkoutBtn').disabled = !formValid();
  }

  ['custName', 'custAddress', 'custNote'].forEach((id) => {
    $('#' + id).addEventListener('input', updateCheckoutBtn);
  });

  function buildOrderMessage() {
    const name = $('#custName').value.trim();
    const delivery = deliverySelect.value;
    const period = $('#custPeriod').value;
    const address = $('#custAddress').value.trim();
    const note = $('#custNote').value.trim();

    const lines = [];
    lines.push('🐾 *FOOD PETS — NOVO PEDIDO* 🐾');
    lines.push('');
    lines.push('*Itens do pedido:*');
    cart.forEach((i) => {
      lines.push(`• ${i.qty}x ${i.name} (${i.weight}) — ${money(i.price * i.qty)}`);
    });
    lines.push('');
    lines.push(`*TOTAL: ${money(cartTotal())}*`);
    lines.push('');
    lines.push('*Dados do cliente:*');
    lines.push(`👤 Nome: ${name}`);
    lines.push(`📦 Tipo: ${delivery}`);
    if (delivery === 'Entrega' && address) {
      lines.push(`📍 Endereço: ${address}`);
    }
    lines.push(`⏰ Melhor horário: ${period}`);
    if (note) {
      lines.push(`📝 Observações: ${note}`);
    }
    lines.push('');
    lines.push('Pedido realizado pelo site Food Pets 🌿');
    return lines.join('\n');
  }

  $('#checkoutBtn').addEventListener('click', () => {
    if (!formValid()) {
      toast('⚠️ Preencha nome e endereço para finalizar!');
      return;
    }
    const msg = encodeURIComponent(buildOrderMessage());
    const url = `https://wa.me/${STORE_CONFIG.whatsapp}?text=${msg}`;
    window.open(url, '_blank', 'noopener');
    toast('🚀 Pedido enviado! Confirme no WhatsApp 😉');
  });

  /* ============================================================
     BUSCA
     ============================================================ */
  const searchInput = $('#searchInput');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      renderProducts();
      if (currentSearch) {
        document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
      }
    }, 250);
  });

  /* ============================================================
     FAQ (acordeão)
     ============================================================ */
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ============================================================
     Links do rodapé -> filtros
     ============================================================ */
  document.querySelectorAll('.footer a[data-cat]').forEach((a) => {
    a.addEventListener('click', () => {
      currentCategory = a.dataset.cat;
      renderFilters();
      renderProducts();
    });
  });

  /* ============================================================
     TOAST
     ============================================================ */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ============================================================
     ESC fecha modal/carrinho
     ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCart();
    }
  });

  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */
  renderFilters();
  renderProducts();
  renderCart();
})();
