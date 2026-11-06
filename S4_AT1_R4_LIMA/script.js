// Base de Produtos Factual Mantida
const catalog = {
    teclado: { name: "Teclado mecânico", price: 299.99 },
    mouse: { name: "Mouse gamer", price: 149.99 },
    headset: { name: "Headset de alta qualidade", price: 199.99 },
    cadeira: { name: "Cadeira ergonômica", price: 499.99 }
};

// Estado do Carrinho em Memória
let cart = [];

// Formatação BRL
function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function validateField(fieldId, value, pattern) {
    const input = document.getElementById(fieldId);
    const errorContainer = document.getElementById(`err-${fieldId}`);
    const fieldGroup = input?.closest('.input-group');
    const isValid = pattern.test(value);

    if (fieldGroup) {
        fieldGroup.classList.toggle('has-error', !isValid && value !== '');
    }

    if (errorContainer) {
        errorContainer.style.display = isValid || value === '' ? 'none' : 'block';
    }

    return isValid;
}

function bindFieldValidation() {
    const fields = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        cardNumber: document.getElementById('card-number'),
        cardHolder: document.getElementById('card-holder'),
        cardExpiry: document.getElementById('card-expiry'),
        cardCvv: document.getElementById('card-cvv')
    };

    if (fields.nome) {
        fields.nome.addEventListener('blur', () => validateField('nome', fields.nome.value.trim(), /.+/));
    }

    if (fields.email) {
        fields.email.addEventListener('blur', () => validateField('email', fields.email.value.trim(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/));
    }

    if (fields.cardNumber) {
        fields.cardNumber.addEventListener('input', () => {
            const digits = fields.cardNumber.value.replace(/\D/g, '').slice(0, 16);
            fields.cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
            validateField('card-number', digits, /^\d{16}$/);
        });
    }

    if (fields.cardHolder) {
        fields.cardHolder.addEventListener('blur', () => validateField('card-holder', fields.cardHolder.value.trim(), /.+/));
    }

    if (fields.cardExpiry) {
        fields.cardExpiry.addEventListener('input', () => {
            const value = fields.cardExpiry.value.replace(/\D/g, '').slice(0, 4);
            fields.cardExpiry.value = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
            validateField('card-expiry', fields.cardExpiry.value, /^\d{2}\/\d{2}$/);
        });
    }

    if (fields.cardCvv) {
        fields.cardCvv.addEventListener('input', () => {
            fields.cardCvv.value = fields.cardCvv.value.replace(/\D/g, '').slice(0, 4);
            validateField('card-cvv', fields.cardCvv.value, /^\d{3,4}$/);
        });
    }
}

function validateProfileForm() {
    const name = document.getElementById('nome')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';

    const validName = validateField('nome', name, /.+/);
    const validEmail = validateField('email', email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    return validName && validEmail;
}

function initializeStore() {
    updateCartBadge();
    renderCheckoutSummary();
    togglePayFields('credit');
    renderCartView();
    bindFieldValidation();
}

// Troca de Abas da SPA
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    const selectedBtn = document.getElementById(`tab-btn-${tabName}`);

    if (selectedTab && selectedBtn) {
        selectedTab.classList.add('active');
        selectedBtn.classList.add('active');
    }

    if (tabName === 'cart') renderCartView();
    if (tabName === 'checkout') renderCheckoutSummary();
}

// Ajuste de Quantidade no Seletor Rápido
function changeQuantitySelect(val) {
    const input = document.getElementById('quantidade');
    if (!input) return;

    let current = parseInt(input.value) || 1;
    current += val;
    if (current < 1) current = 1;
    input.value = current;
}

// Adicionar produto através do seletor da loja
function adicionarAoCarrinho() {
    if (!validateProfileForm()) {
        showToast('Dados incompletos', 'Preencha seu nome e e-mail antes de comprar.');
        switchTab('store');
        return;
    }

    const key = document.getElementById('produto-select').value;
    const qty = parseInt(document.getElementById('quantidade').value) || 1;
    addToCart(key, qty);
}

// Adicionar direto do card
function addItemToCartDirect(key) {
    addToCart(key, 1);
}

// Lógica de adição ao Carrinho
function addToCart(key, qty) {
    const product = catalog[key];
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.key === key);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ key, name: product.name, price: product.price, qty });
    }

    updateCartBadge();
    renderCheckoutSummary();
    showToast('Adicionado ao Carrinho!', `${qty}x ${product.name}`);
}

// Atualizar Contador no Botão da Aba
function updateCartBadge() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-badge-count');
    if (badge) badge.innerText = totalCount;
}

// Renderização Dinâmica da Aba do Carrinho
function renderCartView() {
    const emptyView = document.getElementById('cart-empty-view');
    const filledView = document.getElementById('cart-filled-view');
    const itemsBody = document.getElementById('cart-items-body');

    if (!emptyView || !filledView || !itemsBody) return;

    if (cart.length === 0) {
        emptyView.classList.remove('hidden');
        filledView.classList.add('hidden');
        return;
    }

    emptyView.classList.add('hidden');
    filledView.classList.remove('hidden');

    itemsBody.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${formatBRL(item.price)}</td>
            <td>
                <div class="quantity-picker" style="width: 110px;">
                    <button type="button" onclick="updateItemQty(${index}, -1)">-</button>
                    <input type="number" value="${item.qty}" readonly>
                    <button type="button" onclick="updateItemQty(${index}, 1)">+</button>
                </div>
            </td>
            <td><strong class="highlight-price">${formatBRL(subtotal)}</strong></td>
            <td><button class="btn-remove-item" onclick="removeItem(${index})">Remover</button></td>
        `;
        itemsBody.appendChild(row);
    });

    document.getElementById('cart-subtotal-val').innerText = formatBRL(total);
    document.getElementById('cart-total-val').innerText = formatBRL(total);
}

function updateItemQty(index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        updateCartBadge();
        renderCheckoutSummary();
        renderCartView();
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCheckoutSummary();
    renderCartView();
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Carrinho Vazio', 'Adicione itens antes de prosseguir.');
        return;
    }

    const validProfile = validateProfileForm();
    if (!validProfile) {
        showToast('Perfil incompleto', 'Finalize seu nome e e-mail antes do pagamento.');
        switchTab('store');
        return;
    }

    switchTab('checkout');
}

// Renderização do Resumo na Tela de Pagamento
function renderCheckoutSummary() {
    const container = document.getElementById('checkout-items-list');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum item selecionado.</p>';
    } else {
        cart.forEach(item => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            container.innerHTML += `
                <div class="mini-item">
                    <span>${item.qty}x ${item.name}</span>
                    <strong>${formatBRL(subtotal)}</strong>
                </div>
            `;
        });
    }

    const finalTotal = document.getElementById('checkout-final-total');
    const payTotal = document.getElementById('pay-button-total');

    if (finalTotal) finalTotal.innerText = formatBRL(total);
    if (payTotal) payTotal.innerText = formatBRL(total);
}

// Alternar visibilidade dos campos de pagamento
function togglePayFields(method) {
    const creditFields = document.getElementById('pay-fields-credit');
    const pixFields = document.getElementById('pay-fields-pix');

    if (!creditFields || !pixFields) return;

    if (method === 'credit') {
        creditFields.classList.remove('hidden');
        pixFields.classList.add('hidden');
    } else {
        creditFields.classList.add('hidden');
        pixFields.classList.remove('hidden');
    }
}

// Validação dos Campos de Pagamento
function executePayment(e) {
    e.preventDefault();

    if (cart.length === 0) {
        showToast('Atenção', 'Seu carrinho está vazio!');
        return;
    }

    const payMethod = document.querySelector('input[name="pay_method"]:checked')?.value;

    if (payMethod === 'credit') {
        let valid = true;

        const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
        const cardHolder = document.getElementById('card-holder').value.trim();
        const cardExpiry = document.getElementById('card-expiry').value.trim();
        const cardCvv = document.getElementById('card-cvv').value.trim();

        document.querySelectorAll('.input-group').forEach(el => el.classList.remove('has-error'));

        if (cardNumber.length < 16) {
            document.getElementById('card-number').closest('.input-group').classList.add('has-error');
            valid = false;
        }
        if (!cardHolder) {
            document.getElementById('card-holder').closest('.input-group').classList.add('has-error');
            valid = false;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            document.getElementById('card-expiry').closest('.input-group').classList.add('has-error');
            valid = false;
        }
        if (cardCvv.length < 3) {
            document.getElementById('card-cvv').closest('.input-group').classList.add('has-error');
            valid = false;
        }

        if (!valid) return;
    }

    /*
     * PONTO DE INTEGRAÇÃO DE GATEWAY (Stripe / Mercado Pago / Pagar.me)
     * Envie os dados coletados para o seu servidor backend aprovar a transação.
     */

    showToast('Pedido Processado! 🚀', 'Obrigado por comprar na PixelGear!');
    cart = [];
    updateCartBadge();
    renderCheckoutSummary();
    renderCartView();

    setTimeout(() => {
        switchTab('store');
    }, 2500);
}

// Toast de Notificação
function showToast(title, message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', initializeStore);