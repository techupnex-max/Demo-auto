/* «Автомобилист» — логика страницы */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ================= Утилиты ================= */

  function fmtPrice(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  function fmtMileage(n) {
    return n.toLocaleString('ru-RU') + ' км';
  }

  function statusLabel(car) {
    return car.status === 'reserved' ? 'Забронирован' : 'В наличии';
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* ================= Шапка ================= */

  var header = document.getElementById('siteHeader');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', function () {
    var open = mobileNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  mobileNav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      mobileNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ================= Появление при скролле ================= */

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function observeReveals(root) {
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (node, i) {
      if (!node.style.getPropertyValue('--reveal-delay')) {
        node.style.setProperty('--reveal-delay', (i % 4) * 50 + 'ms');
      }
      revealObserver.observe(node);
    });
  }

  /* ================= Каталог ================= */

  var cars = window.CARS;
  var grid = document.getElementById('carGrid');
  var emptyMsg = document.getElementById('catalogEmpty');
  var resultsCount = document.getElementById('resultsCount');

  var filters = {
    brand: document.getElementById('fBrand'),
    body: document.getElementById('fBody'),
    yearFrom: document.getElementById('fYearFrom'),
    gear: document.getElementById('fGear'),
    drive: document.getElementById('fDrive'),
    priceMax: document.getElementById('fPriceMax')
  };
  var sortSelect = document.getElementById('sortSelect');
  var filterReset = document.getElementById('filterReset');
  var filterToggle = document.getElementById('filterToggle');
  var filterPanel = document.getElementById('filterPanel');
  var filterCount = document.getElementById('filterCount');

  // Заполняем марки и годы из данных
  var brands = cars.map(function (c) { return c.brand; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
  brands.forEach(function (b) {
    filters.brand.appendChild(el('<option value="' + b + '">' + b + '</option>'));
  });
  var years = cars.map(function (c) { return c.year; });
  var minYear = Math.min.apply(null, years);
  for (var y = minYear; y <= new Date().getFullYear(); y++) {
    filters.yearFrom.appendChild(el('<option value="' + y + '">от ' + y + '</option>'));
  }

  // Карточка автомобиля
  function cardHTML(car, idx) {
    var specs = car.year + ' · ' + fmtMileage(car.mileage) + ' · ' + car.engine +
      ' · ' + car.gearShort + ' · ' + car.drive;
    return '' +
      '<article class="car-card reveal" data-id="' + car.id + '" tabindex="0" role="link" ' +
        'aria-label="' + car.brand + ' ' + car.model + ' ' + car.year + ', ' + statusLabel(car) + '" ' +
        'style="--reveal-delay:' + (idx % 3) * 50 + 'ms; --badge-delay: 120ms">' +
        '<div class="car-media">' +
          '<img class="main" src="' + car.photos[0] + '.jpg" ' +
            'alt="' + car.brand + ' ' + car.model + ' ' + car.year + ', вид спереди" loading="lazy">' +
          '<img class="alt" src="' + car.photos[1] + '.jpg" ' +
            'alt="' + car.brand + ' ' + car.model + ' ' + car.year + ', вид сзади" loading="lazy" aria-hidden="true">' +
          '<span class="car-badge' + (car.status === 'reserved' ? ' badge-reserved' : '') + '">' +
            '<span class="badge-dot"></span>' + statusLabel(car) +
          '</span>' +
        '</div>' +
        '<div class="car-info">' +
          '<h3 class="car-title">' + car.brand + ' ' + car.model + '</h3>' +
          '<p class="car-specs">' + specs + '</p>' +
          '<div class="car-foot">' +
            '<span class="car-price">' + fmtPrice(car.price) + '</span>' +
            '<button class="btn-more" type="button" data-id="' + car.id + '">Подробнее</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  // Отслеживание появления бейджа
  var badgeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('badge-in');
        badgeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  function wireCard(node) {
    function open() { location.hash = '#/auto/' + node.dataset.id; }
    node.addEventListener('click', function (e) {
      if (e.target.closest('.btn-more')  e.target === node  e.target.closest('.car-media, .car-info')) open();
    });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    badgeObserver.observe(node);
  }

  function getFiltered() {
    var list = cars.filter(function (c) {
      if (filters.brand.value && c.brand !== filters.brand.value) return false;
      if (filters.body.value && c.body !== filters.body.value) return false;
      if (filters.yearFrom.value && c.year < +filters.yearFrom.value) return false;
      if (filters.gear.value && c.gear !== filters.gear.value) return false;
      if (filters.drive.value && c.drive !== filters.drive.value) return false;
      if (filters.priceMax.value && c.price > +filters.priceMax.value) return false;
      return true;
    });
    switch (sortSelect.value) {
      case 'priceAsc': return list.sort(function (a, b) { return a.price - b.price; });
      case 'priceDesc': return list.sort(function (a, b) { return b.price - a.price; });
      default: return list.sort(function (a, b) { return b.year - a.year || a.price - b.price; });
    }
  }

  // Плавная смена числа «Найдено: N»
  var countRAF = null;
  function animateCount(to) {
    var from = +resultsCount.dataset.value || cars.length;
    if (reduceMotion || from === to) {
      resultsCount.textContent = 'Найдено: ' + to;
      resultsCount.dataset.value = to;
      return;
    }
    if (countRAF) cancelAnimationFrame(countRAF);
    var start = null, dur = 300;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 2);
      resultsCount.textContent = 'Найдено: ' + Math.round(from + (to - from) * ease);
      if (p < 1) countRAF = requestAnimationFrame(step);
      else { resultsCount.dataset.value = to; countRAF = null; }
    }
    countRAF = requestAnimationFrame(step);
  }

  var firstRender = true;

  function renderGrid(animate) {
    var list = getFiltered();
    var existing = {};
    grid.querySelectorAll('.car-card').forEach(function (n) { existing[n.dataset.id] = n; });

    var nextIds = list.map(function (c) { return c.id; });

    function buildAll() {
      grid.innerHTML = '';
      list.forEach(function (car, i) {
        var node = el(cardHTML(car, i));
        wireCard(node);
        grid.appendChild(node);
        revealObserver.observe(node);
      });
      emptyMsg.hidden = list.length > 0;
      animateCount(list.length);
    }
    if (firstRender  !animate  reduceMotion) {
      buildAll();
      firstRender = false;
      return;
    }

    // FLIP: исчезающие уходят плавно
    var gone = Object.keys(existing).filter(function (id) { return nextIds.indexOf(id) === -1; });
    var goneEls = gone.map(function (id) { return existing[id]; });

    // Позиции «до»
    var rectsBefore = {};
    grid.querySelectorAll('.car-card').forEach(function (n) {
      rectsBefore[n.dataset.id] = n.getBoundingClientRect();
    });

    // Перестраиваем DOM в новом порядке
    var fragment = document.createDocumentFragment();
    list.forEach(function (car, i) {
      var node = existing[car.id];
      if (node) {
        delete existing[car.id];
        fragment.appendChild(node); // перенос сохраняет слушателей
      } else {
        node = el(cardHTML(car, i));
        node.classList.add('in');
        node.classList.add('badge-in');
        wireCard(node);
        fragment.appendChild(node);
      }
    });
    Object.keys(existing).forEach(function (id) {
      var n = existing[id];
      n.classList.add('leaving');
      grid.appendChild(n);
    });
    grid.appendChild(fragment);
    emptyMsg.hidden = list.length > 0;
    animateCount(list.length);

    // Позиции «после» → инвертируем и анимируем
    grid.querySelectorAll('.car-card:not(.leaving)').forEach(function (n) {
      var before = rectsBefore[n.dataset.id];
      if (!before) return;
      var after = n.getBoundingClientRect();
      var dx = before.left - after.left;
      var dy = before.top - after.top;
      if (dx || dy) {
        n.animate([
          { transform: 'translate(' + dx + 'px, ' + dy + 'px)' },
          { transform: 'translate(0, 0)' }
        ], { duration: 300, easing: 'cubic-bezier(.22, .61, .36, 1)' });
      }
    });

    // Уходящие: fade-out + scale, затем удаление
    if (goneEls.length) {
      goneEls.forEach(function (n) {
        n.animate([
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.98)' }
        ], { duration: 200, easing: 'cubic-bezier(.22, .61, .36, 1)', fill: 'forwards' });
      });
      setTimeout(function () { goneEls.forEach(function (n) { n.remove(); }); }, reduceMotion ? 0 : 210);
    }
  }

  function activeFilterCount() {
    var n = 0;
    Object.keys(filters).forEach(function (k) { if (filters[k].value) n++; });
    return n;
  }

  function onFilterChange() {
    var n = activeFilterCount();
    filterCount.hidden = n === 0;
    filterCount.textContent = n;
    renderGrid(true);
  }

  Object.keys(filters).forEach(function (k) {
    filters[k].addEventListener('change', onFilterChange);
  });
  sortSelect.addEventListener('change', function () { renderGrid(true); });

  filterReset.addEventListener('click', function () {
    Object.keys(filters).forEach(function (k) { filters[k].value = ''; });
    sortSelect.value = 'new';
    onFilterChange();
  });

  filterToggle.addEventListener('click', function () {
    var open = filterPanel.classList.toggle('open');
    filterToggle.setAttribute('aria-expanded', String(open));
  });

  /* ================= Страница автомобиля ================= */

  var viewHome = document.getElementById('view-home');
  var viewCar = document.getElementById('view-car');

  function carPageHTML(car) {
    var similar = cars
      .filter(function (c) { return c.id !== car.id; })
      .sort(function (a, b) {
        var sa = (a.body === car.body ? 0 : 1) + (a.brand === car.brand ? 0 : 1);
        var sb = (b.body === car.body ? 0 : 1) + (b.brand === car.brand ? 0 : 1);
        return sa - sb || b.year - a.year;
      })
      .slice(0, 3);

    var photosHTML = car.photos.map(function (p, i) {
      return '<img src="' + p + '.jpg" class="' + (i === 0 ? 'active' : '') + '" ' +
        'alt="' + car.brand + ' ' + car.model + ' ' + car.year + ', ' +
        (i === 0 ? 'вид спереди' : 'вид сзади') + '">';
    }).join('');
    var thumbsHTML = car.photos.map(function (p, i) {
      return '<button type="button" class="' + (i === 0 ? 'active' : '') + '" data-idx="' + i + '" ' +
        'aria-label="Показать фото ' + (i + 1) + '">' +
        '<img src="' + p + '.jpg" alt="Миниатюра: ' + car.brand + ' ' + car.model + ', ракурс ' + (i + 1) + '">' +
      '</button>';
    }).join('');

    var specs = [
      ['Марка', car.brand], ['Модель', car.model], ['Год выпуска', String(car.year)],
      ['Пробег', fmtMileage(car.mileage)], ['Двигатель', car.engine],
      ['Коробка передач', car.gear], ['Привод', car.drive],
      ['Кузов', car.body], ['Цвет', car.color], ['VIN', car.vin]
    ].map(function (row) {
      return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td></tr>';
    }).join('');

    var similarHTML = similar.map(function (c, i) {
      return cardHTML(c, i);
    }).join('');

    return '' +
    '<div class="container car-page">' +
      '<div class="car-page-top">' +
        '<a class="back-link" href="#catalog">' +
          '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">' +
            '<path d="M6 1L1 6l5 5M1 6h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>Назад к каталогу</a>' +
        '<span class="car-page-badge' + (car.status === 'reserved' ? ' badge-reserved' : '') + '">' +
          '<span class="badge-dot"></span>' + statusLabel(car) + '</span>' +
      '</div>' +
      '<div class="car-layout">' +
        '<div class="gallery reveal in">' +
          '<div class="gallery-main">' + photosHTML + '</div>' +
          '<div class="gallery-thumbs">' + thumbsHTML + '</div>' +
        '</div>' +
        '<div class="car-summary reveal in">' +
          '<h1>' + car.brand + ' ' + car.model + '</h1>' +
          '<p class="car-page-price">' + fmtPrice(car.price) + ' <small>юридически чист</small></p>' +
          '<table class="spec-table"><tbody>' + specs + '</tbody></table>' +
          '<div class="checked-block">' +
            '<h2>Что сделано и проверено</h2>' +
            '<ul>' + car.checked.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
          '</div>' +
          '<div class="car-cta">' +
            '<a class="btn btn-primary" href="tel:+79221554015">Записаться на осмотр</a>' +
            '<a class="btn btn-ghost" href="#contacts">Контакты</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<section class="similar">' +
        '<h2>Похожие автомобили</h2>' +
        '<div class="car-grid">' + similarHTML + '</div>' +
      '</section>' +
    '</div>';
  }

  function showCar(id) {
    var car = cars.filter(function (c) { return c.id === id; })[0];
    if (!car) { location.hash = '#/'; return; }
    document.title = car.brand + ' ' + car.model + ' ' + car.year + ' — Автомобилист';
    viewHome.hidden = true;
    viewCar.hidden = false;
    viewCar.innerHTML = carPageHTML(car);

    // Галерея: ручное переключение, кросс-фейд 250 мс
    var imgs = viewCar.querySelectorAll('.gallery-main img');
    var thumbs = viewCar.querySelectorAll('.gallery-thumbs button');
    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = +btn.dataset.idx;
        imgs.forEach(function (img, i) { img.classList.toggle('active', i === idx); });
        thumbs.forEach(function (b, i) { b.classList.toggle('active', i === idx); });
      });
    });

    // Проводка похожих карточек
    viewCar.querySelectorAll('.car-card').forEach(function (n) {
      n.classList.add('in', 'badge-in');
      wireCard(n);
    });

    window.scrollTo(0, 0);
  }

  function showHome() {
    document.title = 'Автомобилист — автосервис и автомобили в наличии';
    viewCar.hidden = true;
    viewCar.innerHTML = '';
    viewHome.hidden = false;
  }

  function route() {
    var m = location.hash.match(/^#\/auto\/(.+)$/);
    if (m) showCar(decodeURIComponent(m[1]));
    else showHome();
  }
  window.addEventListener('hashchange', route);

  /* ================= Форма обратного звонка ================= */
 var form = document.getElementById('callbackForm');
  var formStatus = document.getElementById('formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameInput = form.elements.name;
    var phoneInput = form.elements.phone;
    var digits = phoneInput.value.replace(/\D/g, '');
    var errs = [];
    if (!nameInput.value.trim()) { errs.push(nameInput); }
    if (digits.length < 10) { errs.push(phoneInput); }
    [nameInput, phoneInput].forEach(function (i) { i.classList.remove('invalid'); });
    if (errs.length) {
      errs.forEach(function (i) { i.classList.add('invalid'); });
      formStatus.className = 'form-status err';
      formStatus.textContent = !nameInput.value.trim()
        ? 'Укажите имя и телефон — перезвоним.'
        : 'Проверьте номер телефона: нужно не меньше 10 цифр.';
      errs[0].focus();
      return;
    }
    formStatus.className = 'form-status ok';
    formStatus.textContent = 'Принято. Перезвоним в течение 15 минут в рабочее время.';
    form.reset();
  });

  /* ================= Старт ================= */

  renderGrid(false);
  observeReveals(document);
  route();
})();
