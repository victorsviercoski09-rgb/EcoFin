(() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const currency = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const storageKey = 'ecofin_simulacoes_v1';
    const CDI_ANNUAL_ASSUMPTION = 10.65;

    let simulations = readSimulations();
    let activeFilter = 'Todas';
    let unit = 'months';
    let rateUnit = 'annual';
    let lastFocus = null;

    function readSimulations() {
        try {
            const values = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(values)
                ? values.filter(item => item && Array.isArray(item.points))
                : [];
        } catch {
            return [];
        }
    }

    function persist() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(simulations));
        } catch {
            // O armazenamento local pode estar indisponível.
        }
    }

    function openModal() {
        lastFocus = document.activeElement;
        $('#modal-backdrop').hidden = false;
        $('input[name="initial"]').focus();
    }

    function closeModal() {
        $('#modal-backdrop').hidden = true;
        $('#form-error').textContent = '';

        if (lastFocus?.focus) {
            lastFocus.focus();
        }
    }

    function monthlyRate(raw) {
        const rate = raw / 100;

        if (rateUnit === 'monthly') {
            return rate;
        }

        const annual = rateUnit === 'cdi'
            ? (CDI_ANNUAL_ASSUMPTION / 100) * rate
            : rate;

        return Math.pow(1 + annual, 1 / 12) - 1;
    }

    function buildPoints(initial, contribution, months, monthly) {
        const points = [
            { month: 0, balance: initial, invested: initial }
        ];

        let balance = initial;

        for (let month = 1; month <= months; month++) {
            balance = balance * (1 + monthly) + contribution;

            points.push({
                month,
                balance,
                invested: initial + contribution * month
            });
        }

        return points;
    }

    function periodLabel(months) {
        if (months % 12 === 0) {
            return `${months / 12} ${months / 12 === 1 ? 'ano' : 'anos'}`;
        }

        return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }

    function applySummary(item) {
        if (!item) {
            $('#total-investido').textContent = currency.format(0);
            $('#rendimento-estimado').textContent = currency.format(0);
            $('#valor-final').textContent = currency.format(0);
            return;
        }

        const last = item.points[item.points.length - 1];

        $('#total-investido').textContent = currency.format(last.invested);
        $('#rendimento-estimado').textContent =
            currency.format(last.balance - last.invested);
        $('#valor-final').textContent = currency.format(last.balance);
    }

    function render() {
        const filtered = simulations.filter(item =>
            activeFilter === 'Todas' ||
            (activeFilter === 'Tesouro'
                ? item.type.startsWith('Tesouro')
                : item.type === activeFilter)
        );

        const host = $('#simulation-content');

        $('#simulation-count').textContent =
            `${filtered.length} ${filtered.length === 1
                ? 'simulação salva'
                : 'simulações salvas'
            } neste dispositivo`;

        host.replaceChildren();

        if (!filtered.length) {
            if (simulations.length && activeFilter !== 'Todas') {
                const noMatch = document.createElement('div');
                noMatch.className = 'empty-state';
                noMatch.innerHTML =
                    '<div class="empty-icon" aria-hidden="true">⌕</div>' +
                    '<h3>Nenhuma simulação nesta categoria</h3>' +
                    '<p>Escolha outro filtro ou crie uma nova projeção.</p>';

                host.append(noMatch);
            } else {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.innerHTML =
                    '<div class="empty-icon" aria-hidden="true">⌁</div>' +
                    '<h3>Nenhuma simulação ainda</h3>' +
                    '<p>Use “Investimento Fixo” para projetar o crescimento do seu dinheiro mês a mês.</p>' +
                    '<div class="type-hints">' +
                    '<article class="type-hint"><strong>CDB</strong>' +
                    '<p>Renda fixa de bancos, geralmente atrelada ao CDI.</p></article>' +
                    '<article class="type-hint"><strong>LCI</strong>' +
                    '<p>Letra de Crédito Imobiliário, que pode ter isenção de IR.</p></article>' +
                    '<article class="type-hint"><strong>Tesouro Selic</strong>' +
                    '<p>Título público que acompanha a taxa Selic.</p></article>' +
                    '<article class="type-hint"><strong>Tesouro Pré-fixado</strong>' +
                    '<p>Taxa definida no momento da aplicação.</p></article>' +
                    '</div>';

                host.append(empty);
            }

            applySummary(null);
            return;
        }

        const list = document.createElement('div');
        list.className = 'simulation-list';

        filtered.forEach(item => {
            const card = document.createElement('article');
            card.className = 'simulation-card';

            const top = document.createElement('div');
            top.className = 'simulation-top';

            const title = document.createElement('div');
            title.className = 'simulation-title';

            const icon = document.createElement('span');
            icon.className = 'mini-icon';
            icon.textContent = '↗';

            const text = document.createElement('div');
            const heading = document.createElement('h3');
            heading.textContent = item.type;

            const sub = document.createElement('p');
            sub.textContent =
                `${periodLabel(item.months)} · ${item.contribution
                    ? `${currency.format(item.contribution)}/mês`
                    : 'sem aporte mensal'
                }`;

            text.append(heading, sub);
            title.append(icon, text);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'delete-button';
            remove.textContent = 'Remover';
            remove.setAttribute('aria-label', `Remover simulação ${item.type}`);
            remove.addEventListener('click', () => {
                simulations = simulations.filter(entry => entry.id !== item.id);
                persist();
                render();
            });

            top.append(title, remove);

            const stats = document.createElement('div');
            stats.className = 'simulation-stats';

            const rateLabel = item.rateUnit === 'monthly'
                ? '% a.m.'
                : item.rateUnit === 'cdi'
                    ? '% do CDI'
                    : '% a.a.';

            const values = [
                ['Valor inicial', currency.format(item.initial)],
                [
                    'Taxa informada',
                    `${item.rate.toLocaleString('pt-BR', {
                        maximumFractionDigits: 2
                    })}${rateLabel}`
                ],
                ['Valor final', currency.format(item.points.at(-1).balance)]
            ];

            values.forEach(([label, value]) => {
                const box = document.createElement('div');
                const small = document.createElement('span');
                const strong = document.createElement('strong');

                small.textContent = label;
                strong.textContent = value;
                box.append(small, strong);
                stats.append(box);
            });

            const wrap = document.createElement('div');
            wrap.className = 'chart-wrap';

            const canvas = document.createElement('canvas');
            canvas.setAttribute('role', 'img');
            canvas.setAttribute(
                'aria-label',
                `Gráfico de evolução de ${item.type} em ${item.months} meses`
            );

            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';

            wrap.append(canvas, tooltip);
            card.append(top, stats, wrap);
            list.append(card);
        });

        host.append(list);

        $$('.simulation-card', list).forEach((card, index) => {
            drawChart(
                $('.chart-wrap canvas', card),
                $('.chart-tooltip', card),
                filtered[index]
            );
        });

        applySummary(filtered[0]);
    }

    function drawChart(canvas, tooltip, item) {
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        const rect = canvas.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rect.width;
        const h = rect.height;
        const pad = {
            left: 70,
            right: 18,
            top: 16,
            bottom: 30
        };

        const values = item.points.map(point => point.balance);
        let min = Math.min(...values);
        let max = Math.max(...values);

        if (max === min) {
            max += 1;
        }

        const span = max - min;
        min = Math.max(0, min - span * 0.08);
        max += span * 0.12;

        const x = index =>
            pad.left +
            (w - pad.left - pad.right) *
            index /
            Math.max(1, item.points.length - 1);

        const y = value =>
            pad.top +
            (h - pad.top - pad.bottom) *
            (1 - (value - min) / (max - min));

        const compactCurrency = new Intl.NumberFormat('pt-BR', {
            notation: 'compact',
            maximumFractionDigits: 1
        });

        function paint(activeIndex = null) {
            ctx.clearRect(0, 0, w, h);
            ctx.font = '11px DM Sans, sans-serif';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < 4; i++) {
                const value = min + (max - min) * i / 3;
                const yy = y(value);

                ctx.beginPath();
                ctx.moveTo(pad.left, yy);
                ctx.lineTo(w - pad.right, yy);
                ctx.strokeStyle = '#243146';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = '#8794a8';
                ctx.textAlign = 'right';
                ctx.fillText(compactCurrency.format(value), pad.left - 9, yy);
            }

            const gradient = ctx.createLinearGradient(
                0,
                pad.top,
                0,
                h - pad.bottom
            );

            gradient.addColorStop(0, 'rgba(91,163,255,.25)');
            gradient.addColorStop(1, 'rgba(91,163,255,0)');

            ctx.beginPath();

            item.points.forEach((point, index) => {
                if (index) {
                    ctx.lineTo(x(index), y(point.balance));
                } else {
                    ctx.moveTo(x(index), y(point.balance));
                }
            });

            ctx.lineTo(x(item.points.length - 1), h - pad.bottom);
            ctx.lineTo(x(0), h - pad.bottom);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();

            item.points.forEach((point, index) => {
                if (index) {
                    ctx.lineTo(x(index), y(point.balance));
                } else {
                    ctx.moveTo(x(index), y(point.balance));
                }
            });

            ctx.strokeStyle = '#6aaaff';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.fillStyle = '#8794a8';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText('Mês 0', pad.left, h - 20);
            ctx.textAlign = 'right';
            ctx.fillText(`Mês ${item.months}`, w - pad.right, h - 20);

            if (activeIndex !== null) {
                const point = item.points[activeIndex];
                const px = x(activeIndex);
                const py = y(point.balance);

                ctx.beginPath();
                ctx.moveTo(px, pad.top);
                ctx.lineTo(px, h - pad.bottom);
                ctx.strokeStyle = 'rgba(174, 197, 230, 0.32)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#8bbcff';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#e7f1ff';
                ctx.stroke();
            }
        }

        function show(event) {
            const bounds = canvas.getBoundingClientRect();
            const pointerX = Math.max(
                pad.left,
                Math.min(w - pad.right, event.clientX - bounds.left)
            );

            const index = Math.round(
                (pointerX - pad.left) /
                (w - pad.left - pad.right) *
                (item.points.length - 1)
            );

            const point = item.points[index];
            const earnings = point.balance - point.invested;
            const px = x(index);
            const py = y(point.balance);

            paint(index);

            tooltip.innerHTML =
                `<strong>${currency.format(point.balance)}</strong>` +
                `<span>Mês ${point.month} · ${point.month === 0
                    ? 'início'
                    : `${currency.format(earnings)} de rendimento`
                }</span>`;

            tooltip.style.display = 'block';
            tooltip.style.left =
                `${Math.max(4, Math.min(w - 190, px + 12))}px`;
            tooltip.style.top = `${Math.max(3, py - 18)}px`;
        }

        paint();

        canvas.addEventListener('pointermove', show);
        canvas.addEventListener('pointerdown', show);

        canvas.addEventListener('pointerleave', () => {
            tooltip.style.display = 'none';
            paint();
        });
    }

    $('#open-modal').addEventListener('click', openModal);
    $('#close-modal').addEventListener('click', closeModal);
    $('#cancel-modal').addEventListener('click', closeModal);

    $('#modal-backdrop').addEventListener('click', event => {
        if (event.target === $('#modal-backdrop')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !$('#modal-backdrop').hidden) {
            closeModal();
        }
    });

    $$('[data-unit]').forEach(button => {
        button.addEventListener('click', () => {
            unit = button.dataset.unit;

            $$('[data-unit]').forEach(item => {
                item.classList.toggle('selected', item === button);
            });
        });
    });

    $$('[data-rate]').forEach(button => {
        button.addEventListener('click', () => {
            rateUnit = button.dataset.rate;

            $$('[data-rate]').forEach(item => {
                item.classList.toggle('selected', item === button);
            });

            $('#rate-hint').textContent = rateUnit === 'cdi'
                ? `CDI estimado fixo em ${CDI_ANNUAL_ASSUMPTION.toLocaleString('pt-BR')
                }% a.a. para esta projeção; a taxa real pode mudar.`
                : rateUnit === 'monthly'
                    ? 'Informe a taxa mensal do investimento.'
                    : 'Informe a taxa anual do investimento.';
        });
    });

    $$('[data-filter]').forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;

            $$('[data-filter]').forEach(item => {
                item.classList.toggle('selected', item === button);
            });

            render();
        });
    });

    $('#investment-form').addEventListener('submit', event => {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const initial = Number(form.get('initial'));
        const contribution = Number(form.get('contribution') || 0);
        const rawTerm = Number(form.get('term'));
        const rate = Number(form.get('rate'));
        const months = rawTerm * (unit === 'years' ? 12 : 1);
        const error = $('#form-error');

        if (!Number.isFinite(initial) || initial <= 0) {
            error.textContent = 'Informe um valor inicial maior que zero.';
            return;
        }

        if (
            !Number.isFinite(contribution) ||
            contribution < 0 ||
            !Number.isFinite(rawTerm) ||
            rawTerm < 1 ||
            months > 600 ||
            !Number.isFinite(rate) ||
            rate < 0 ||
            rate > 1000
        ) {
            error.textContent =
                'Confira os valores. O prazo deve ser de 1 a 600 meses.';
            return;
        }

        const monthly = monthlyRate(rate);

        if (!Number.isFinite(monthly)) {
            error.textContent = 'A rentabilidade informada é inválida.';
            return;
        }

        const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: form.get('type'),
            initial,
            contribution,
            months,
            rate,
            rateUnit,
            monthlyRate: monthly,
            points: buildPoints(initial, contribution, months, monthly),
            createdAt: new Date().toISOString()
        };

        simulations.unshift(item);
        persist();
        activeFilter = 'Todas';

        $$('[data-filter]').forEach(button => {
            button.classList.toggle(
                'selected',
                button.dataset.filter === 'Todas'
            );
        });

        render();
        closeModal();
        event.currentTarget.reset();

        unit = 'months';
        rateUnit = 'annual';

        $$('[data-unit]').forEach((button, index) => {
            button.classList.toggle('selected', index === 0);
        });

        $$('[data-rate]').forEach((button, index) => {
            button.classList.toggle('selected', index === 0);
        });

        $('#rate-hint').textContent = 'Informe a taxa anual do investimento.';
    });

    let user = null;

    try {
        user = JSON.parse(
            localStorage.getItem('ecofinUsuario') ||
            sessionStorage.getItem('ecofinUsuario') ||
            'null'
        );
    } catch {
        // Perfil inválido.
    }

    if (user?.nome) {
        const initials = user.nome
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();

        $('#avatar').textContent = initials || 'EF';
    }

    render();

    window.addEventListener('resize', () => {
        $$('canvas').forEach((canvas, index) => {
            const filtered = simulations.filter(item =>
                activeFilter === 'Todas' ||
                (activeFilter === 'Tesouro'
                    ? item.type.startsWith('Tesouro')
                    : item.type === activeFilter)
            );

            const wrap = canvas.closest('.chart-wrap');

            if (wrap && filtered[index]) {
                const tip = $('.chart-tooltip', wrap);
                drawChart(canvas, tip, filtered[index]);
            }
        });
    });
})();